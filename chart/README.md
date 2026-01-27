# Application Helm Chart Template

This is a copy-paste template for building clean, multi-service Helm charts for your apps.
It is intentionally generic so each app repo can publish its own OCI chart and be consumed
by ArgoCD and Renovate.

## Goals

- Multi-service apps in one chart (api, web, worker, jobs, etc.)
- Optional internal dependencies (Postgres, Redis, MinIO)
- External service wiring (your cluster resources)
- Infisical-friendly env injection (via existing K8s Secrets)
- Observability hooks (OTEL + ServiceMonitor/PodMonitor)
- Ingress that can target internal Nginx or external Cloudflare
- Simple, elegant, and easy to modify

## Quick start (copy into an app repo)

1. Copy the folder into your app repo:

```bash
cp -R template/applications-template ./chart
```

1. Rename the chart:

- Update `chart/Chart.yaml` `name`, `version`, and `appVersion`
- Update image repositories in `chart/values.yaml`

1. Edit `chart/values.yaml`:

- Define your components (api, worker, web, etc.)
- Configure ingress if needed
- Configure external services or enable internal dependencies

1. Pull dependencies (if you enable Postgres/Redis/MinIO):

```bash
helm dependency update ./chart
```

## Template structure

```text
chart/
  Chart.yaml
  values.yaml
  values.schema.json
  templates/
    _helpers.tpl
    deployment.yaml
    service.yaml
    ingress.yaml
    serviceaccount.yaml
    hpa.yaml
    pdb.yaml
    servicemonitor.yaml
    podmonitor.yaml
    networkpolicy.yaml
    NOTES.txt
```

## Values contract (high level)

### `global`

Common settings for all components: labels, annotations, env, envFrom, volumes, scheduling,
security contexts, and imagePullSecrets.

### `components`

Each component becomes a Deployment, and can optionally have a Service and Ingress.
You can define as many components as you want.

Key fields you will use most often:

- `components.<name>.image`
- `components.<name>.ports`
- `components.<name>.service`
- `components.<name>.ingress`
- `components.<name>.env` / `envFrom`
- `components.<name>.resources`
- `components.<name>.autoscaling`
- `components.<name>.metrics`

### `externalServices`

For connecting to shared cluster services. When `injectEnv` is true, env vars are injected
into all components automatically:

- Postgres: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`,
  `POSTGRES_PASSWORD` (secret), `DATABASE_URL` (secret)
- Redis: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (secret)
- MinIO: `MINIO_ENDPOINT`, `MINIO_BUCKET`, `MINIO_REGION`,
  `MINIO_ACCESS_KEY` (secret), `MINIO_SECRET_KEY` (secret)

### `observability`

- `otel`: emits standard OTEL env vars for traces/logs
- `serviceMonitor` and `podMonitor`: integrates with Prometheus Operator

### `networkPolicy`

Optional NetworkPolicy for all chart pods.

### `postgresql`, `redis`, `minio`

Optional in-cluster dependencies (Bitnami subcharts). Disable them when you want
external services instead.

## Infisical support (recommended pattern)

This template assumes secrets already exist in the cluster. If you use Infisical:

1. Use the Infisical operator (or External Secrets) to sync secrets into Kubernetes.
2. Reference those secrets via `global.envFrom` or `components.<name>.envFrom`.

Example:

```text
global:
  envFrom:
    - secretRef:
        name: myapp-infisical
```

## Ingress strategy

Per component you can set:

- `ingress.enabled: true`
- `ingress.className`: `nginx-internal` or your Cloudflare ingress class
- `ingress.annotations`: for Cloudflare, cert-manager, external-dns, etc.

This lets you route internal-only apps to your local Nginx, and public apps to Cloudflare.

## Observability integration

To enable OTEL env vars:

```text
observability:
  otel:
    enabled: true
    endpoint: http://alloy.observability-system.svc.cluster.local:4318
    protocol: http/protobuf
```

To enable ServiceMonitor or PodMonitor:

```text
observability:
  serviceMonitor:
    enabled: true
```

Then enable `metrics` on the component that exposes `/metrics`.

## Internal dependencies vs external services

- **External services** are configured under `externalServices`.
- **Internal dependencies** are enabled under `postgresql`, `redis`, `minio`.

Choose one per service (do not enable both at the same time).

## Publishing to OCI (per app repo)

```bash
helm package ./chart
helm registry login <your-registry>
helm push app-template-0.1.0.tgz oci://<your-registry>/charts
```

Update the chart version in `Chart.yaml` on every release.

## Using with ArgoCD

In your GitOps repo, create an ArgoCD Application that points to the OCI chart
and references a values file stored in the GitOps repo.

This keeps app repos generic and your cluster-specific wiring centralized.

## Renovate

Renovate can track and update chart versions in your ArgoCD manifests. Keep versions
semver-friendly and tag releases.

## Notes

This template is intentionally simple. It covers the common needs of most services
without over-abstracting. If a component needs special logic, extend the chart in
that app repo rather than complicating the template.
