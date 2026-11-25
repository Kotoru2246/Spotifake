# The config is copied into the image instead of bind-mounted: when Jenkins runs
# "docker compose" through the host's Docker socket, paths in its workspace do not exist on the host.
FROM prom/prometheus:v3.5.0
COPY prometheus.yml alerts.yml /etc/prometheus/
