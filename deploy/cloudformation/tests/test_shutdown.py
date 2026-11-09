"""Exercise the exact Lambda code shipped in the templates, without AWS calls."""

import os
from pathlib import Path
import sys
import time
import types
import unittest
from unittest.mock import patch

import yaml

ROOT = Path(__file__).resolve().parents[1]


class AwsFake:
    def __init__(self, deadline=0, db="available", fail=None, tasks=None):
        self.deadline = deadline
        self.db = db
        self.fail = fail
        self.calls = []
        self.tasks = tasks or []

    def client(self, service, **kwargs):
        fake = self

        class Client:
            def get_paginator(self, operation):
                class Paginator:
                    def paginate(self, **params):
                        fake.calls.append((service, operation, params))
                        if operation == fake.fail:
                            raise RuntimeError("Simulated AWS failure")
                        return [{"taskArns": fake.tasks}]
                return Paginator()

            def __getattr__(self, operation):
                def call(**params):
                    fake.calls.append((service, operation, params))
                    if operation == fake.fail:
                        raise RuntimeError("Simulated AWS failure")
                    if operation == "get_parameter":
                        return {"Parameter": {"Value": str(fake.deadline)}}
                    if operation == "describe_db_instances":
                        return {"DBInstances": [{"DBInstanceStatus": fake.db}]}
                    if operation == "describe_instances":
                        return {"Reservations": [{"Instances": [{"State": {"Name": "running"}}]}]}
                    return {}
                return call
        return Client()


def invoke(layer, logical_id, fake):
    template = yaml.safe_load((ROOT / f"{layer}.yaml").read_text())
    code = template["Resources"][logical_id]["Properties"]["Code"]["ZipFile"]
    boto = types.ModuleType("boto3")
    boto.client = fake.client
    config = types.ModuleType("botocore.config")
    config.Config = lambda **kwargs: kwargs
    env = {"LEASE": "lease", "DATABASE": "database", "REDIS": "redis", "CLUSTER": "cluster",
           "SCALING_ID": "service/cluster/api", "SERVICES": "api,storefront,worker"}
    with patch.dict(sys.modules, {"boto3": boto, "botocore.config": config}), patch.dict(os.environ, env):
        namespace = {}
        exec(compile(code, f"{layer}/{logical_id}", "exec"), namespace)
        return namespace["handler"]({}, None)


class ShutdownTests(unittest.TestCase):
    def test_retained_guard_allows_only_a_live_recovery_window(self):
        for deadline, expected in [(int(time.time()) + 3600, "recovery-window"), (0, "stop-requested")]:
            with self.subTest(deadline=deadline), patch.dict(os.environ, {"RECOVERY_DEADLINE": str(deadline)}):
                fake = AwsFake()
                self.assertEqual(invoke("retained-guard", "DataWatchdog", fake)["state"], expected)
                self.assertEqual(len(fake.calls), 0 if deadline else 2)

    def test_retained_guard_stops_only_an_available_database(self):
        for state in ["available", "stopped", "stopping", "starting"]:
            with self.subTest(state=state):
                fake = AwsFake(db=state)
                result = invoke("retained-guard", "DataWatchdog", fake)
                self.assertEqual(result["state"], "stop-requested" if state == "available" else state)
                stops = [c for c in fake.calls if c[1] == "stop_db_instance"]
                self.assertEqual(len(stops), 1 if state == "available" else 0)
                self.assertTrue(all(c[0] == "rds" for c in fake.calls))

    def test_live_lease_does_not_stop_compute(self):
        for layer, name in [("data", "DataWatchdog"), ("app", "Watchdog")]:
            with self.subTest(layer=layer):
                fake = AwsFake(deadline=int(time.time()) + 3600)
                self.assertEqual(invoke(layer, name, fake)["state"], "leased")
                self.assertEqual([c[1] for c in fake.calls], ["get_parameter"])

    def test_data_watchdog_stops_rds_after_automatic_restart(self):
        fake = AwsFake()
        invoke("data", "DataWatchdog", fake)
        self.assertIn("stop_db_instance", [c[1] for c in fake.calls])
        self.assertIn("stop_instances", [c[1] for c in fake.calls])

    def test_already_stopped_database_is_not_stopped_again(self):
        fake = AwsFake(db="stopped")
        invoke("data", "DataWatchdog", fake)
        self.assertNotIn("stop_db_instance", [c[1] for c in fake.calls])

    def test_database_failure_does_not_skip_redis_shutdown(self):
        fake = AwsFake(fail="stop_db_instance")
        with self.assertRaises(RuntimeError):
            invoke("data", "DataWatchdog", fake)
        self.assertIn("stop_instances", [c[1] for c in fake.calls])

    def test_scaling_suspended_before_services_stop(self):
        fake = AwsFake()
        invoke("app", "Watchdog", fake)
        scaling = next(i for i, c in enumerate(fake.calls) if c[1] == "register_scalable_target")
        stops = [i for i, c in enumerate(fake.calls) if c[1] == "update_service"]
        self.assertEqual(len(stops), 3)
        self.assertTrue(all(scaling < i for i in stops))
        params = fake.calls[scaling][2]
        self.assertEqual(params["MaxCapacity"], 0)
        self.assertTrue(params["SuspendedState"]["DynamicScalingOutSuspended"])

    def test_one_service_failure_still_attempts_all_services(self):
        fake = AwsFake(fail="update_service")
        with self.assertRaises(RuntimeError):
            invoke("app", "Watchdog", fake)
        self.assertEqual(len([c for c in fake.calls if c[1] == "update_service"]), 3)

    def test_expiry_cleans_up_owned_one_off_tasks(self):
        fake = AwsFake(tasks=["migration-task", "seed-task"])
        invoke("app", "Watchdog", fake)
        stops = [c[2]["task"] for c in fake.calls if c[1] == "stop_task"]
        self.assertEqual(stops, ["migration-task", "seed-task"])
        listing = next(c[2] for c in fake.calls if c[1] == "list_tasks")
        self.assertEqual(listing, {"cluster": "cluster", "startedBy": "commerce-operation"})

    def test_one_off_stop_failure_does_not_skip_other_tasks(self):
        fake = AwsFake(tasks=["migration-task", "seed-task"], fail="stop_task")
        with self.assertRaises(RuntimeError):
            invoke("app", "Watchdog", fake)
        self.assertEqual(len([c for c in fake.calls if c[1] == "stop_task"]), 2)

    def test_missing_lease_fails_closed_and_reports_error(self):
        for layer, name, expected in [("data", "DataWatchdog", "stop_db_instance"), ("app", "Watchdog", "update_service")]:
            with self.subTest(layer=layer):
                fake = AwsFake(fail="get_parameter")
                with self.assertRaises(RuntimeError):
                    invoke(layer, name, fake)
                self.assertIn(expected, [c[1] for c in fake.calls])


if __name__ == "__main__":
    unittest.main()
