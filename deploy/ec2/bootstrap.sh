#!/bin/bash
set -euo pipefail
umask 077

# Stop the instance at the approved absolute UTC deadline, including after reboot.
cat > /etc/systemd/system/commerce-session-stop.service <<'EOF'
[Unit]
Description=Stop the approved commerce demonstration session
[Service]
Type=oneshot
ExecStart=/usr/sbin/shutdown -h now
EOF
cat > /etc/systemd/system/commerce-session-stop.timer <<EOF
[Unit]
Description=Four-hour commerce demonstration limit
[Timer]
OnCalendar=SESSION_DEADLINE
Persistent=true
Unit=commerce-session-stop.service
[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now commerce-session-stop.timer

dnf install -y docker git python3
systemctl enable --now docker amazon-ssm-agent
install -d /usr/local/lib/docker/cli-plugins
cd /usr/local/lib/docker/cli-plugins
curl --fail --location --retry 3 https://github.com/docker/compose/releases/download/v5.6.0/docker-compose-linux-x86_64 -o docker-compose-linux-x86_64
curl --fail --location --retry 3 https://github.com/docker/compose/releases/download/v5.6.0/docker-compose-linux-x86_64.sha256 -o docker-compose.sha256
sha256sum --check docker-compose.sha256
install -m 755 docker-compose-linux-x86_64 docker-compose
rm docker-compose-linux-x86_64 docker-compose.sha256
curl --fail --location --retry 3 https://github.com/docker/buildx/releases/download/v0.38.2/buildx-v0.38.2.linux-amd64 -o buildx-v0.38.2.linux-amd64
curl --fail --location --retry 3 https://github.com/docker/buildx/releases/download/v0.38.2/checksums.txt -o buildx-checksums.txt
grep ' \*buildx-v0.38.2.linux-amd64$' buildx-checksums.txt | sha256sum --check
install -m 755 buildx-v0.38.2.linux-amd64 docker-buildx
rm buildx-v0.38.2.linux-amd64 buildx-checksums.txt

# Swap provides headroom for Node build processes.
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
printf '/swapfile none swap sw 0 0\n' >> /etc/fstab
install -d -m 700 /srv/commerce
docker compose version
touch /var/lib/commerce-bootstrap-ready
