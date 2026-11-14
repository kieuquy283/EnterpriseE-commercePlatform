#!/usr/bin/env python3
"""CloudFormation plans and bounded session lifecycle. Never prints secret values."""

import argparse
import datetime
import json
from pathlib import Path
import subprocess
import sys
import time
import uuid

ROOT = Path(__file__).resolve().parent
REGION = "ap-southeast-2"
OPERATION_OWNER = "commerce-operation"


def aws(*args, allow_failure=False):
    command = ["aws", "--profile", SETTINGS.get("profile", "aws-project"),
               "--region", REGION, "--no-cli-pager", "--output", "json", *args]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode:
        if allow_failure and "does not exist" in result.stderr:
            return None
        # Do not echo command arguments: ECS overrides can contain credentials.
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout) if result.stdout.strip() else {}


def stack_name(layer):
    return f"{SETTINGS.get('stackPrefix', 'commerce')}-{layer}"


def stack(layer, required=True):
    response = aws("cloudformation", "describe-stacks", "--stack-name", stack_name(layer),
                   allow_failure=not required)
    return response["Stacks"][0] if response else None


def outputs(layer):
    return {o["OutputKey"]: o["OutputValue"] for o in stack(layer).get("Outputs", [])}


def lease(hours):
    if not 0 <= hours <= 12:
        raise ValueError("Session must be between 0 and 12 hours")
    deadline = int(time.time() + hours * 3600) if hours else 0
    aws("ssm", "put-parameter", "--name", outputs("data")["Lease"],
        "--type", "String", "--value", str(deadline), "--overwrite")
    print("Session deadline:", datetime.datetime.fromtimestamp(deadline, datetime.timezone.utc).isoformat()
          if deadline else "paused")


def plan(layer):
    params = {}
    if layer == "foundation":
        params.update(SETTINGS.get("foundationParameters", {}))
        if bool(params.get("StoreDomain")) != bool(params.get("ApiDomain")):
            raise ValueError("Supply both foundation domains, or omit both until confirmed")
    if layer == "data":
        params = {"FoundationStack": stack_name("foundation"), **SETTINGS.get("dataParameters", {})}
        email = params.get("AlertEmail", "")
        if "@" not in email or "example.com" in email:
            raise ValueError("Set dataParameters.AlertEmail for cost and watchdog notifications")
    if layer == "app":
        params = {"FoundationStack": stack_name("foundation"), "DataStack": stack_name("data"),
                  **SETTINGS.get("appParameters", {})}
        for key in ["StoreDomain", "ApiDomain", "CertificateArn", "BackendImage", "StorefrontImage"]:
            value = params.get(key, "")
            if not value or "example.com" in value or "REPLACE" in value:
                raise ValueError(f"Set appParameters.{key} before planning the application stack")
        if params["StoreDomain"] == params["ApiDomain"]:
            raise ValueError("Storefront and API must have distinct hostnames")
        if params.get("StorefrontEnabled") == "true":
            if params.get("PublishableKey", "pk_bootstrap") == "pk_bootstrap":
                raise ValueError("Seed the database and supply the real publishable key first")
            if params["BackendImage"] == params["StorefrontImage"]:
                raise ValueError("Build a separate storefront image before enabling it")
        # Releases always enter a zero-task state; start runs migrations before traffic.
        params["Running"] = "false"
    existing = stack(layer, required=False)
    parameters = [{"ParameterKey": key, "ParameterValue": str(value)} for key, value in params.items()]
    if existing and existing["StackStatus"] != "REVIEW_IN_PROGRESS":
        summary = aws("cloudformation", "get-template-summary", "--template-body", "file://" + str(ROOT / f"{layer}.yaml"))
        declared = {p["ParameterKey"] for p in summary.get("Parameters", [])}
        parameters.extend({"ParameterKey": p["ParameterKey"], "UsePreviousValue": True}
                          for p in existing.get("Parameters", [])
                          if p["ParameterKey"] in declared and p["ParameterKey"] not in params)
    change_name = "review-" + uuid.uuid4().hex[:12]
    response = aws("cloudformation", "create-change-set", "--stack-name", stack_name(layer),
                   "--change-set-name", change_name, "--change-set-type",
                   "UPDATE" if existing and existing["StackStatus"] != "REVIEW_IN_PROGRESS" else "CREATE",
                   "--template-body", "file://" + str(ROOT / f"{layer}.yaml"),
                   "--capabilities", "CAPABILITY_IAM",
                   "--parameters", json.dumps(parameters),
                   "--tags", "Key=Project,Value=commerce-demo")
    change_id = response["Id"]
    try:
        aws("cloudformation", "wait", "change-set-create-complete", "--change-set-name", change_id)
    except RuntimeError:
        detail = aws("cloudformation", "describe-change-set", "--change-set-name", change_id)
        reason = detail.get("StatusReason", "")
        if detail.get("Status") == "FAILED" and "didn't contain changes" in reason:
            print("No infrastructure changes:", stack_name(layer))
            return
        raise
    detail = aws("cloudformation", "describe-change-set", "--change-set-name", change_id)
    for change in detail.get("Changes", []):
        c = change["ResourceChange"]
        print(c["Action"], c["LogicalResourceId"], c.get("Replacement", ""))
    print("Review change set:", change_id)
    print("Apply only after reviewing replacements and the cost estimate.")


def apply(change_id, allow_stateful_changes=False):
    detail = aws("cloudformation", "describe-change-set", "--change-set-name", change_id)
    names = {stack_name(layer) for layer in ["foundation", "data", "app"]}
    if detail["StackName"] not in names:
        raise ValueError("Change set is outside this configured environment")
    if detail["Status"] != "CREATE_COMPLETE" or detail["ExecutionStatus"] != "AVAILABLE":
        raise ValueError("Change set is not ready for execution")
    protected = {"AWS::RDS::DBInstance", "AWS::EC2::Instance", "AWS::S3::Bucket",
                 "AWS::SecretsManager::Secret", "AWS::KMS::Key", "AWS::ECR::Repository"}
    for change in detail.get("Changes", []):
        resource = change["ResourceChange"]
        if (resource["ResourceType"] in protected
                and (resource["Action"] == "Remove" or resource.get("Replacement") in ["True", "Conditional"])
                and not allow_stateful_changes):
            raise ValueError("Stateful replacement/removal requires backup review and --allow-stateful-changes: "
                             + resource["LogicalResourceId"])
    current = aws("cloudformation", "describe-stacks", "--stack-name", detail["StackName"])["Stacks"][0]
    waiter = "stack-create-complete" if current["StackStatus"] == "REVIEW_IN_PROGRESS" else "stack-update-complete"
    aws("cloudformation", "execute-change-set", "--change-set-name", change_id)
    aws("cloudformation", "wait", waiter, "--stack-name", detail["StackName"])
    print("Applied:", detail["StackName"])


def running_parameter(value):
    current = stack("app")
    parameters = [{"ParameterKey": p["ParameterKey"], "UsePreviousValue": True}
                  for p in current["Parameters"] if p["ParameterKey"] != "Running"]
    parameters.append({"ParameterKey": "Running", "ParameterValue": value})
    values = {p["ParameterKey"]: p.get("ParameterValue") for p in current["Parameters"]}
    if values.get("Running") != value:
        aws("cloudformation", "update-stack", "--stack-name", stack_name("app"),
            "--use-previous-template", "--capabilities", "CAPABILITY_IAM", "--parameters", json.dumps(parameters))
        aws("cloudformation", "wait", "stack-update-complete", "--stack-name", stack_name("app"))
    return values


def scaling(app, running):
    service = app["ApiService"].split("/")[-1]
    aws("application-autoscaling", "register-scalable-target", "--service-namespace", "ecs",
        "--resource-id", f"service/{app['Cluster']}/{service}",
        "--scalable-dimension", "ecs:service:DesiredCount", "--min-capacity", "1" if running else "0",
        "--max-capacity", "2" if running else "0", "--suspended-state",
        json.dumps({"DynamicScalingInSuspended": not running, "DynamicScalingOutSuspended": not running,
                    "ScheduledScalingSuspended": not running}))


def invoke_watchdog(name):
    import tempfile
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "response.json"
        response = aws("lambda", "invoke", "--function-name", name, str(path))
        if response.get("FunctionError"):
            raise RuntimeError("Shutdown watchdog failed; check its CloudWatch logs immediately")


def pause():
    lease(0)
    app_stack = stack("app", required=False)
    if app_stack and app_stack["StackStatus"] not in ["REVIEW_IN_PROGRESS", "DELETE_COMPLETE"]:
        app = outputs("app")
        scaling(app, False)
        for key in ["ApiService", "StorefrontService", "WorkerService"]:
            aws("ecs", "update-service", "--cluster", app["Cluster"], "--service", app[key], "--desired-count", "0")
        stop_operations(app)
        aws("ecs", "wait", "services-stable", "--cluster", app["Cluster"], "--services",
            app["ApiService"], app["StorefrontService"], app["WorkerService"])
        running_parameter("false")
    invoke_watchdog(outputs("data")["DataWatchdog"])
    print("Stop requested. Run status to verify stopped states; storage, secrets and any ALB still charge.")


def wait_database_stopped(identifier, timeout=1800):
    deadline = time.monotonic() + timeout
    while True:
        db = aws("rds", "describe-db-instances", "--db-instance-identifier", identifier)["DBInstances"][0]
        if db["DBInstanceStatus"] == "stopped":
            return
        if time.monotonic() >= deadline:
            raise RuntimeError("Database did not stop before the timeout; inspect its state before retrying")
        time.sleep(min(15, max(0, deadline - time.monotonic())))


def start_data(hours):
    if hours <= 0:
        raise ValueError("Starting data services requires a positive session duration")
    if stack("retained-guard", required=False):
        raise RuntimeError("Retained database guard is active. Restore the normal data watchdog, then remove "
                           + stack_name("retained-guard") + " before starting data services")
    lease(hours)
    data = outputs("data")
    db = aws("rds", "describe-db-instances", "--db-instance-identifier", data["DatabaseId"])["DBInstances"][0]
    if db["DBInstanceStatus"] == "stopping":
        wait_database_stopped(data["DatabaseId"])
        db["DBInstanceStatus"] = "stopped"
    if db["DBInstanceStatus"] == "stopped":
        aws("rds", "start-db-instance", "--db-instance-identifier", data["DatabaseId"])
    aws("rds", "wait", "db-instance-available", "--db-instance-identifier", data["DatabaseId"])
    instance = aws("ec2", "describe-instances", "--instance-ids", data["RedisId"])["Reservations"][0]["Instances"][0]
    if instance["State"]["Name"] == "stopping":
        aws("ec2", "wait", "instance-stopped", "--instance-ids", data["RedisId"])
        instance["State"]["Name"] = "stopped"
    if instance["State"]["Name"] == "stopped":
        aws("ec2", "start-instances", "--instance-ids", data["RedisId"])
    aws("ec2", "wait", "instance-status-ok", "--instance-ids", data["RedisId"])
    command = aws("ssm", "send-command", "--instance-ids", data["RedisId"],
                  "--document-name", "AWS-RunShellScript", "--parameters",
                  json.dumps({"commands": ["cloud-init status --wait >/dev/null && test \"$(docker exec commerce-redis redis-cli ping)\" = PONG"]}))
    command_id = command["Command"]["CommandId"]
    aws("ssm", "wait", "command-executed", "--command-id", command_id, "--instance-id", data["RedisId"])


def task(action):
    deadline = int(aws("ssm", "get-parameter", "--name", outputs("data")["Lease"])["Parameter"]["Value"])
    if deadline <= time.time() + 60:
        raise ValueError("Start data or renew the session before running a one-off task")
    app = outputs("app")
    foundation = outputs("foundation")
    commands = {
        "migrate": ["node", "../../../../node_modules/@medusajs/cli/cli.js", "db:migrate"],
        "seed": ["node", "../../../../node_modules/@medusajs/cli/cli.js", "exec", "./src/scripts/seed-commerce.js"],
        "publishable-key": ["node", "../../../../node_modules/@medusajs/cli/cli.js", "exec", "./src/scripts/print-storefront-key.js"],
    }
    network = {"awsvpcConfiguration": {"assignPublicIp": "ENABLED",
               "subnets": [foundation["PublicSubnet1"], foundation["PublicSubnet2"]],
               "securityGroups": [foundation["AppGroup"]]}}
    response = aws("ecs", "run-task", "--cluster", app["Cluster"], "--task-definition", app["ApiTask"],
                   "--launch-type", "FARGATE", "--platform-version", "1.4.0", "--started-by", OPERATION_OWNER,
                   "--network-configuration", json.dumps(network), "--overrides",
                   json.dumps({"containerOverrides": [{"name": "api", "command": commands[action]}]}))
    if response.get("failures") or not response.get("tasks"):
        raise RuntimeError("ECS could not place the one-off task: " + json.dumps(response.get("failures", [])))
    arn = response["tasks"][0]["taskArn"]
    print("One-off task:", arn)
    try:
        aws("ecs", "wait", "tasks-stopped", "--cluster", app["Cluster"], "--tasks", arn)
    except BaseException:
        try:
            aws("ecs", "stop-task", "--cluster", app["Cluster"], "--task", arn,
                "--reason", "Operator task wait failed or was interrupted")
        except RuntimeError:
            print("Task cleanup failed; the session watchdog will retry. Check " + arn, file=sys.stderr)
        raise
    done = aws("ecs", "describe-tasks", "--cluster", app["Cluster"], "--tasks", arn)["tasks"][0]
    if not done.get("containers") or any(c.get("exitCode") != 0 for c in done["containers"]):
        raise RuntimeError("One-off task failed; inspect the API log group before starting services")
    print("Task succeeded; output is in the API CloudWatch log group.")


def stop_operations(app):
    response = aws("ecs", "list-tasks", "--cluster", app["Cluster"], "--started-by", OPERATION_OWNER)
    tasks = response.get("taskArns", [])
    for arn in tasks:
        aws("ecs", "stop-task", "--cluster", app["Cluster"], "--task", arn,
            "--reason", "Demo paused or release starting")
    for offset in range(0, len(tasks), 100):
        aws("ecs", "wait", "tasks-stopped", "--cluster", app["Cluster"], "--tasks", *tasks[offset:offset + 100])


def start(hours):
    app = outputs("app")
    start_data(hours)
    # Pause application compute before migrations even if a previous session was running.
    scaling(app, False)
    for key in ["ApiService", "StorefrontService", "WorkerService"]:
        aws("ecs", "update-service", "--cluster", app["Cluster"], "--service", app[key], "--desired-count", "0")
    stop_operations(app)
    aws("ecs", "wait", "services-stable", "--cluster", app["Cluster"], "--services",
        app["ApiService"], app["StorefrontService"], app["WorkerService"])
    task("migrate")
    values = running_parameter("true")
    # Reconcile watchdog-induced runtime changes even when CFN Running already equals true.
    for key in ["ApiService", "WorkerService", "StorefrontService"]:
        count = "0" if key == "StorefrontService" and values.get("StorefrontEnabled") != "true" else "1"
        aws("ecs", "update-service", "--cluster", app["Cluster"], "--service", app[key], "--desired-count", count)
    scaling(app, True)
    aws("ecs", "wait", "services-stable", "--cluster", app["Cluster"], "--services",
        app["ApiService"], app["StorefrontService"], app["WorkerService"])
    print("Services stable. Check public DNS, HTTPS and checkout before calling the release healthy.")


def status():
    states = {}
    for layer in ["foundation", "data", "app"]:
        s = stack(layer, required=False)
        states[layer] = s
        print(stack_name(layer), s["StackStatus"] if s else "absent")
    if not states["data"] or not states["data"].get("Outputs"):
        print("No provisioned data outputs to inspect.")
        return
    data = outputs("data")
    db = aws("rds", "describe-db-instances", "--db-instance-identifier", data["DatabaseId"])["DBInstances"][0]
    ec2 = aws("ec2", "describe-instances", "--instance-ids", data["RedisId"])["Reservations"][0]["Instances"][0]
    print("Database:", db["DBInstanceStatus"], "Redis:", ec2["State"]["Name"])
    print("Lease UTC epoch:", aws("ssm", "get-parameter", "--name", data["Lease"])["Parameter"]["Value"])
    s = states["app"]
    if s and s["StackStatus"] != "REVIEW_IN_PROGRESS":
        app = outputs("app")
        services = aws("ecs", "describe-services", "--cluster", app["Cluster"], "--services",
                       app["ApiService"], app["StorefrontService"], app["WorkerService"])
        for service in services["services"]:
            print(service["serviceName"], "desired", service["desiredCount"], "running", service["runningCount"])
    print("This status is not a billing statement. Retained resources can still charge.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, default=ROOT / "settings.json")
    commands = parser.add_subparsers(dest="command", required=True)
    for name in ["plan"]:
        commands.add_parser(name).add_argument("layer", choices=["foundation", "data", "app"])
    apply_parser = commands.add_parser("apply")
    apply_parser.add_argument("change_set")
    apply_parser.add_argument("--allow-stateful-changes", action="store_true",
                              help="Allow reviewed retained-resource replacement/removal after verifying backups")
    for name in ["start", "start-data", "renew"]:
        commands.add_parser(name).add_argument("--hours", type=float)
    commands.add_parser("task").add_argument("action", choices=["migrate", "seed", "publishable-key"])
    for name in ["pause", "hibernate", "status"]:
        commands.add_parser(name)
    args = parser.parse_args()
    global SETTINGS
    SETTINGS = json.loads(args.config.read_text())
    if SETTINGS.get("region", REGION) != REGION:
        raise ValueError("This project is restricted to ap-southeast-2")
    hours = getattr(args, "hours", None)
    if hours is None:
        hours = SETTINGS.get("sessionHours", 4)
    if args.command == "plan": plan(args.layer)
    elif args.command == "apply": apply(args.change_set, args.allow_stateful_changes)
    elif args.command == "start": start(hours)
    elif args.command == "start-data": start_data(hours)
    elif args.command == "renew": lease(hours)
    elif args.command == "task": task(args.action)
    elif args.command == "pause": pause()
    elif args.command == "status": status()
    elif args.command == "hibernate":
        pause()
        if stack("app", required=False):
            aws("cloudformation", "delete-stack", "--stack-name", stack_name("app"))
            aws("cloudformation", "wait", "stack-delete-complete", "--stack-name", stack_name("app"))
        print("Application stack removed. Persistent data watchdog remains active; data and storage retained.")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, ValueError, OSError, KeyError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
