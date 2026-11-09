from pathlib import Path
import unittest

import yaml


ROOT = Path(__file__).resolve().parents[1]


class ImageProxyTemplateTests(unittest.TestCase):
    def test_private_bucket_has_no_cloudfront_or_public_read_grant(self):
        data = yaml.safe_load((ROOT / "data.yaml").read_text())
        resources = data["Resources"]
        self.assertFalse(any(resource["Type"].startswith("AWS::CloudFront::")
                             for resource in resources.values()))
        public_access = resources["ImagesBucket"]["Properties"]["PublicAccessBlockConfiguration"]
        self.assertTrue(all(public_access.values()))
        statements = resources["ImagesPolicy"]["Properties"]["PolicyDocument"]["Statement"]
        self.assertEqual([statement["Effect"] for statement in statements], ["Deny"])
        self.assertNotIn("ImageUrl", data["Outputs"])

    def test_api_and_worker_upload_urls_use_the_public_image_proxy(self):
        app = yaml.safe_load((ROOT / "app.yaml").read_text())
        tasks = [resource for resource in app["Resources"].values()
                 if resource["Type"] == "AWS::ECS::TaskDefinition"]
        proxy_containers = []
        for task in tasks:
            for container in task["Properties"]["ContainerDefinitions"]:
                environment = {item["Name"]: item["Value"]
                               for item in container.get("Environment", [])}
                if "S3_BUCKET" in environment:
                    proxy_containers.append(environment)
                    self.assertEqual(environment["S3_FILE_URL"],
                                     {"Fn::Sub": "https://${ApiDomain}/product-images"})
                    self.assertEqual(environment["S3_PUBLIC_IMAGE_PROXY"], "true")
                    self.assertEqual(environment["S3_DISABLE_ACL"], "true")
                    self.assertEqual(environment["S3_AUTHENTICATION_METHOD"], "s3-iam-role")
        self.assertEqual(len(proxy_containers), 2)
        self.assertEqual(app["Outputs"]["ImageUrl"]["Value"],
                         {"Fn::Sub": "https://${ApiDomain}/product-images"})
