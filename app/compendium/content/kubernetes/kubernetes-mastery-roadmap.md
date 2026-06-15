---
title: "Kubernetes Mastery Roadmap"
collection: "kubernetes"
sourcePath: "Knowledge base/kubernetes/00 Kubernetes Mastery Roadmap.md"
order: 0
---
Purpose: This note gives a rigorous learning path for mastering Kubernetes from core mental models to production operations without confusing local practice with production readiness.

# Kubernetes Mastery Roadmap

This roadmap is organized around the sequence that makes Kubernetes easier to reason about: API first, reconciliation second, workloads third, networking and storage fourth, then security, operations, and platform engineering. Use [Kubernetes](/compendium/kubernetes/kubernetes) as the root map and [01 Kubernetes Mental Model and Architecture](/compendium/kubernetes/kubernetes-mental-model-and-architecture) as the foundation note.

## Mastery Outcomes

By the end of this path, you should be able to:

- Explain Kubernetes as a declarative API and reconciliation system.
- Trace a workload from `kubectl apply` through admission, storage, scheduling, kubelet execution, networking, and status reporting.
- Debug Pods, Deployments, Services, DNS, scheduling, image pulls, probes, quotas, permissions, and node pressure.
- Design label, namespace, RBAC, resource, and policy conventions for a multi-team cluster.
- Separate local-cluster learning from production evidence.
- Know where Kubernetes stops and where surrounding platform choices begin.

## Phase 1: The Core Model

Goal: Build the mental model before memorizing commands.

| Learn | Why it matters | Practice |
|---|---|---|
| Desired state | Everything starts with API objects that describe intent. | Apply a Pod, Deployment, Service, and ConfigMap. Read `metadata`, `spec`, and `status`. |
| Reconciliation loops | Kubernetes is made of controllers converging state. | Scale a Deployment and watch ReplicaSet and Pod changes. |
| API server and etcd | kube-apiserver is the durable front door, etcd is the backing store. | Use `kubectl get --raw /api` and inspect API groups. |
| Control plane vs worker nodes | Decisions and execution are separate. | Compare `kubectl get nodes -o wide` with running Pods. |
| Events and conditions | Troubleshooting begins with controller feedback. | Run `kubectl describe pod` on a failing Pod and read Events before logs. |

Read: [01 Kubernetes Mental Model and Architecture](/compendium/kubernetes/kubernetes-mental-model-and-architecture)

Review questions:

- What changes when you edit `spec.replicas` on a Deployment?
- Why does a ReplicaSet create Pods instead of the Deployment directly acting forever on each Pod?
- What is stored in etcd, and why should ordinary components not bypass kube-apiserver?

## Phase 2: Object Metadata and API Shape

Goal: Treat Kubernetes manifests as API contracts, not as inert YAML.

Core topics:

- `apiVersion`, `kind`, `metadata`, `spec`, and `status`.
- Names, UIDs, resource versions, generations, and managed fields.
- API groups and versions such as `apps/v1`, `batch/v1`, `networking.k8s.io/v1`, and `rbac.authorization.k8s.io/v1`.
- Namespaced vs cluster-scoped resources.
- Labels and selectors.
- Annotations.
- Owner references and garbage collection.
- Finalizers.
- Server-side apply and field ownership.

Example:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: apps
  labels:
    app.kubernetes.io/name: web
    app.kubernetes.io/component: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app.kubernetes.io/name: web
  template:
    metadata:
      labels:
        app.kubernetes.io/name: web
        app.kubernetes.io/component: frontend
    spec:
      containers:
        - name: web
          image: ghcr.io/example/web:1.0.0
          ports:
            - containerPort: 8080
```

Common mistake: changing a Deployment selector after creation. Selectors are identity contracts. If selector and template labels do not match, the controller cannot safely manage the intended Pods.

## Phase 3: Workloads

Goal: Know which workload API matches which application shape.

| Workload | Use for | Avoid when |
|---|---|---|
| Pod | Smallest schedulable unit, debugging, static manifests. | Long-lived app management by humans. Prefer higher-level controllers. |
| Deployment | Stateless replicated services and rolling updates. | Stable network identity or ordered storage is required. |
| ReplicaSet | Deployment implementation detail. | Direct user management in normal app delivery. |
| StatefulSet | Stable identity, ordered rollout, persistent identity. | Stateless apps that do not need stable names. |
| DaemonSet | One Pod per selected node, agents, log collectors, CNIs. | Arbitrary application scaling. |
| Job | Run-to-completion batch work. | Long-running services. |
| CronJob | Scheduled batch work. | Work that must run continuously. |

Production guidance:

- Use Deployments for most stateless services.
- Use StatefulSets only when the application actually needs stable identity or storage semantics.
- Use Jobs for migrations carefully. Make them idempotent, observable, and bounded.
- Use DaemonSets for node agents, not for convenience scaling.

## Phase 4: Scheduling and Resources

Goal: Understand why Pods do or do not land on nodes.

Core topics:

- Resource requests and limits.
- QoS classes.
- Node selectors, affinity, anti-affinity, taints, and tolerations.
- Topology spread constraints.
- Priority classes and preemption.
- Quotas and LimitRanges.
- Node pressure and evictions.

Troubleshooting sequence:

1. Read `kubectl describe pod`.
2. Inspect scheduling Events.
3. Check resource requests against node allocatable capacity.
4. Check taints, tolerations, affinity, and topology constraints.
5. Check namespace quota.
6. Check Pod Security Admission, admission webhooks, and image policy.

## Phase 5: Networking and DNS

Goal: Build a precise model of Pod IPs, Services, DNS, ingress, and Gateway API.

Core topics:

- Every Pod gets an IP in the cluster network.
- Services provide stable virtual endpoints over changing Pod backends.
- kube-proxy or an equivalent dataplane programs Service routing.
- CoreDNS resolves Service and Pod DNS names.
- NetworkPolicy is enforced by a capable CNI plugin, not by the API object alone.
- Ingress is an API object that needs an ingress controller.
- Gateway API is an official add-on API family that requires CRDs and a controller.

Common mistake: creating a NetworkPolicy and assuming it works without confirming that the CNI enforces it.

## Phase 6: Configuration, Secrets, and Storage

Goal: Separate configuration delivery, sensitive material, and durable data.

| Area | Kubernetes object | Production concern |
|---|---|---|
| App config | ConfigMap | Rollout triggers, validation, size limits, config drift. |
| Sensitive values | Secret | Encryption at rest, external secret managers, RBAC, rotation, audit. |
| Persistent data | PersistentVolumeClaim | StorageClass behavior, reclaim policy, snapshots, backup, restore. |
| Driver integration | CSI | Topology, expansion, snapshots, mount options, failure modes. |

Guidance:

- Do not treat Kubernetes Secrets as complete secret management. They are API objects with access controlled by RBAC and cluster storage configuration.
- Keep restore drills close to storage design. A backup that has never been restored is only an assumption.
- For stateful systems, understand application consistency, not only volume consistency.

## Phase 7: Security and Policy

Goal: Build defense in depth.

Core topics:

- Authentication and authorization.
- RBAC verbs, resources, subresources, namespaced roles, and cluster roles.
- ServiceAccounts and projected tokens.
- Admission control.
- Pod Security Admission, stable since Kubernetes v1.25.
- PodSecurityPolicy removal in Kubernetes v1.25.
- NetworkPolicy.
- Image provenance, registry policy, and runtime hardening.
- Audit logs.

Tradeoff table:

| Control | Strength | Limitation |
|---|---|---|
| RBAC | Controls API access precisely. | Does not control in-Pod network or filesystem behavior. |
| Pod Security Admission | Built-in baseline for Pod security levels. | Namespace-label driven and less expressive than custom policy engines. |
| NetworkPolicy | Limits traffic paths when enforced by CNI. | Default behavior depends on policies and plugin support. |
| Admission policy | Blocks invalid or risky objects before persistence. | Requires careful rollout to avoid breaking delivery. |
| Runtime detection | Detects behavior after start. | Reactive unless paired with prevention and response. |

## Phase 8: Observability and Troubleshooting

Goal: Debug from API state outward.

Recommended order:

1. Object status and conditions.
2. Events.
3. Controller logs.
4. Pod logs.
5. Probe results.
6. Node status and kubelet logs.
7. Metrics.
8. Network traces and DNS checks.
9. Admission and audit logs.

Useful commands:

```bash
kubectl get deploy,rs,pod,svc,endpointslice -n apps
kubectl describe pod -n apps web-abc123
kubectl get events -n apps --sort-by=.lastTimestamp
kubectl auth can-i create pods --as system:serviceaccount:apps:web
kubectl explain deployment.spec.strategy
kubectl diff -f manifests/
```

## Phase 9: Production Platform Practice

Goal: Move from "I can run a Pod" to "this cluster is operable."

Production areas:

- Cluster lifecycle: upgrades, version skew, node replacement, etcd backup.
- GitOps: desired state is reviewed, applied, and audited.
- Policy: admission checks before runtime failures.
- Capacity: requests, limits, autoscaling, quotas, and headroom.
- Networking: CNI, DNS, Service routing, ingress, Gateway, certificates.
- Storage: CSI, snapshots, backups, restore tests, reclaim policies.
- Security: RBAC, Pod Security Admission, network policy, image controls, audit.
- Reliability: SLOs, alerts, runbooks, incident drills.

Production-vs-local check:

| Claim | Local evidence | Production evidence |
|---|---|---|
| The manifest is valid | `kubectl apply --dry-run=server` or local apply. | Server-side dry run against the target cluster plus admission policy result. |
| The app starts | Pod runs in kind or minikube. | Pod runs with production security context, resources, CNI, DNS, registry, and storage. |
| The rollout is safe | Manual test passes. | Rollout strategy, probes, alerts, rollback plan, and capacity headroom are verified. |
| The service is reachable | Port-forward works. | Service, Gateway or Ingress, DNS, TLS, firewall, and client paths work. |
| The data is safe | PVC exists. | Backup, restore, retention, encryption, and failure-domain behavior are tested. |

## Suggested Study Loop

For each topic:

1. Read the concept.
2. Create the smallest object that demonstrates it.
3. Break it intentionally.
4. Read Events and status before changing anything.
5. Fix it.
6. Explain which controller reconciled the state.
7. Write one production caveat.

Example loop for Deployments:

1. Create a Deployment with three replicas.
2. Change the image to a missing tag.
3. Observe `ImagePullBackOff`.
4. Inspect ReplicaSet, Pods, Events, and Deployment conditions.
5. Fix the tag.
6. Explain how the Deployment controller, ReplicaSet controller, scheduler, kubelet, and runtime each participated.

## Mastery Checklist

- I can explain Kubernetes without saying "it runs Docker."
- I can draw the control plane and worker node components from memory.
- I can explain why kube-apiserver, not etcd, is the integration boundary.
- I can describe scheduler decisions using requests, constraints, and node state.
- I can explain CoreDNS and Service discovery.
- I can distinguish Ingress from Gateway API.
- I can explain why Gateway API is an add-on official project, not a core object installed in every cluster.
- I can explain server-side apply and field ownership.
- I can debug a stuck deletion caused by a finalizer.
- I can debug a Deployment that is not progressing.
- I can explain why local cluster success is not production proof.

## Cross Links

- Root map: [Kubernetes](/compendium/kubernetes/kubernetes)
- Architecture model: [01 Kubernetes Mental Model and Architecture](/compendium/kubernetes/kubernetes-mental-model-and-architecture)
- Crash course: [00 Kubernetes Mastery Roadmap](/compendium/kubernetes/kubernetes-mastery-roadmap)
