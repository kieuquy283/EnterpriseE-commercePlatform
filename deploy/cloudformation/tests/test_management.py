import importlib.util
import json
from pathlib import Path
import unittest
import time
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("commerce_manage", ROOT / "manage.py")
manage = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(manage)


class ManagementTests(unittest.TestCase):
    def setUp(self):
        manage.SETTINGS = {"profile": "aws-project", "stackPrefix": "commerce"}

    def test_apply_chooses_waiter_from_stack_state(self):
        # DescribeChangeSet does not promise a ChangeSetType field.
        for state, waiter in [("REVIEW_IN_PROGRESS", "stack-create-complete"),
                              ("UPDATE_COMPLETE", "stack-update-complete")]:
            calls = []

            def fake(*args, **kwargs):
                calls.append(args)
                if args[1] == "describe-change-set":
                    return {"StackName": "commerce-app", "Status": "CREATE_COMPLETE", "ExecutionStatus": "AVAILABLE"}
                if args[1] == "describe-stacks":
                    return {"Stacks": [{"StackStatus": state}]}
                return {}

            with self.subTest(state=state), patch.object(manage, "aws", side_effect=fake):
                manage.apply("reviewed-change-set")
            self.assertIn(("cloudformation", "wait", waiter, "--stack-name", "commerce-app"), calls)

    def test_apply_rejects_another_environment(self):
        with patch.object(manage, "aws", return_value={"StackName": "unrelated-data"}) as aws:
            with self.assertRaises(ValueError):
                manage.apply("wrong-change-set")
        self.assertEqual(aws.call_count, 1)

    def test_session_limit_rejected_before_any_aws_call(self):
        with patch.object(manage, "aws") as aws:
            with self.assertRaises(ValueError):
                manage.lease(13)
        aws.assert_not_called()

    def test_update_plan_preserves_omitted_parameters(self):
        calls = []

        def fake(*args, **kwargs):
            calls.append(args)
            if args[1] == "describe-stacks":
                return {"Stacks": [{"StackStatus": "CREATE_COMPLETE", "Parameters": [
                    {"ParameterKey": "GitHubRepository", "ParameterValue": "owner/project"},
                    {"ParameterKey": "StoreDomain", "ParameterValue": "shop.domain.test"},
                    {"ParameterKey": "RemovedParameter", "ParameterValue": "old"}]}]}
            if args[1] == "get-template-summary":
                return {"Parameters": [{"ParameterKey": "GitHubRepository"}, {"ParameterKey": "StoreDomain"}]}
            if args[1] == "create-change-set":
                return {"Id": "change-set"}
            return {"Changes": []}

        with patch.object(manage, "aws", side_effect=fake):
            manage.plan("foundation")
        create = next(c for c in calls if c[1] == "create-change-set")
        parameters = json.loads(create[create.index("--parameters") + 1])
        self.assertEqual(parameters, [
            {"ParameterKey": "GitHubRepository", "UsePreviousValue": True},
            {"ParameterKey": "StoreDomain", "UsePreviousValue": True}])

    def test_apply_blocks_stateful_replacement(self):
        response = {"StackName": "commerce-data", "Status": "CREATE_COMPLETE", "ExecutionStatus": "AVAILABLE",
                    "Changes": [{"ResourceChange": {"ResourceType": "AWS::EC2::Instance", "Action": "Modify",
                                                     "Replacement": "True", "LogicalResourceId": "Redis"}}]}
        with patch.object(manage, "aws", return_value=response) as aws:
            with self.assertRaises(ValueError):
                manage.apply("replacement-change-set")
        self.assertEqual(aws.call_count, 1)

    def test_one_off_task_requires_live_lease(self):
        with patch.object(manage, "outputs", return_value={"Lease": "lease"}), \
             patch.object(manage, "aws", return_value={"Parameter": {"Value": "0"}}) as aws:
            with self.assertRaises(ValueError):
                manage.task("migrate")
        self.assertEqual(aws.call_count, 1)

    def test_task_wait_failure_requests_stop(self):
        calls = []

        def fake(*args, **kwargs):
            calls.append(args)
            if args[1] == "get-parameter":
                return {"Parameter": {"Value": str(int(time.time()) + 3600)}}
            if args[1] == "run-task":
                return {"tasks": [{"taskArn": "migration-task"}]}
            if args[1] == "wait":
                raise RuntimeError("Wait timed out")
            return {}

        def outputs(layer):
            return {"data": {"Lease": "lease"}, "app": {"Cluster": "cluster", "ApiTask": "task-definition"},
                    "foundation": {"PublicSubnet1": "a", "PublicSubnet2": "b", "AppGroup": "sg"}}[layer]

        with patch.object(manage, "outputs", side_effect=outputs), patch.object(manage, "aws", side_effect=fake):
            with self.assertRaises(RuntimeError):
                manage.task("migrate")
        stop = next(c for c in calls if c[1] == "stop-task")
        self.assertIn("migration-task", stop)

    def test_start_checks_app_before_starting_billable_data(self):
        with patch.object(manage, "outputs", side_effect=RuntimeError("Application stack absent")), \
             patch.object(manage, "start_data") as start_data:
            with self.assertRaises(RuntimeError):
                manage.start(4)
        start_data.assert_not_called()

    def test_zero_hour_start_is_rejected(self):
        with patch.object(manage, "aws") as aws:
            with self.assertRaises(ValueError):
                manage.start_data(0)
        aws.assert_not_called()

    def test_database_stop_wait_polls_until_stopped(self):
        responses = [{"DBInstances": [{"DBInstanceStatus": state}]} for state in ["stopping", "stopped"]]
        with patch.object(manage, "aws", side_effect=responses) as aws, patch.object(manage.time, "sleep"):
            manage.wait_database_stopped("demo-db")
        self.assertEqual(aws.call_count, 2)
        self.assertTrue(all(c.args[:2] == ("rds", "describe-db-instances") for c in aws.call_args_list))

    def test_retained_guard_blocks_start_before_lease_or_compute_changes(self):
        with patch.object(manage, "stack", return_value={"StackStatus": "CREATE_COMPLETE"}), \
             patch.object(manage, "lease") as lease, patch.object(manage, "aws") as aws:
            with self.assertRaisesRegex(RuntimeError, "guard is active"):
                manage.start_data(1)
        lease.assert_not_called()
        aws.assert_not_called()

    def test_database_stop_wait_times_out_without_starting_database(self):
        with patch.object(manage, "aws", return_value={"DBInstances": [{"DBInstanceStatus": "stopping"}]}) as aws:
            with self.assertRaisesRegex(RuntimeError, "did not stop"):
                manage.wait_database_stopped("demo-db", timeout=0)
        aws.assert_called_once_with("rds", "describe-db-instances", "--db-instance-identifier", "demo-db")

    def test_unchanged_plan_is_reported_without_failure(self):
        def fake(*args, **kwargs):
            if args[1] == "describe-stacks":
                return {"Stacks": [{"StackStatus": "CREATE_COMPLETE", "Parameters": []}]}
            if args[1] == "create-change-set":
                return {"Id": "no-op"}
            if args[1] == "wait":
                raise RuntimeError("Waiter encountered a terminal failure state")
            if args[1] == "describe-change-set":
                return {"Status": "FAILED", "StatusReason": "The submitted information didn't contain changes."}
            return {"Parameters": []}

        with patch.object(manage, "aws", side_effect=fake):
            manage.plan("foundation")

    def test_storefront_cannot_start_with_placeholder_key(self):
        manage.SETTINGS["appParameters"] = {
            "StoreDomain": "shop.real-domain.test", "ApiDomain": "api.real-domain.test",
            "CertificateArn": "certificate", "BackendImage": "backend", "StorefrontImage": "storefront",
            "StorefrontEnabled": "true", "PublishableKey": "pk_bootstrap",
        }
        with patch.object(manage, "aws") as aws:
            with self.assertRaises(ValueError):
                manage.plan("app")
        aws.assert_not_called()


if __name__ == "__main__":
    unittest.main()
