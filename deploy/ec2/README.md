# EC2 rehearsal and fallback

The primary course deployment is [Fargate/RDS](../RUNBOOK.md). This directory preserves the November 6 single-VM rehearsal; use the [fallback runbook](RUNBOOK.md) only for a deliberate recovery/demo, with separate DNS or an explicit cutover.

Sydney, one Linux `m7i-flex.large` (approved after Free plan rejected
`t3.medium`), encrypted 30 GiB gp3,
SSM administration, inbound TCP 80/443 only, and an absolute four-hour stop
deadline. `template.json` is the reviewed CloudFormation source. Bootstrap
installs Docker/Compose, verifies the Compose checksum and enables the stop
timer before package installation. The timer must be renewed deliberately
before a later session; starting an instance with an expired persistent timer
can stop it again.

The private encrypted staging bucket transports a filtered source archive only;
the instance role can read only `source.tar.gz`. The archive excludes `.env`,
deployment settings, Git metadata, dependencies and generated output. Remove
the staging object after transfer. Production secrets are generated on EC2 and
never copied to the operator machine or written to deployment command output.

The template retains the instance if the stack is deleted and keeps the root
disk if the instance is terminated. Stop compute after the rehearsal; delete
resources only after separately reviewing data retention and backups. The
existing RDS/Fargate stacks are outside this deployment.
