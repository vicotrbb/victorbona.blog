---
title: "Linux Systems Mastery Roadmap"
collection: "linux-systems-engineering"
sourcePath: "Knowledge base/linux-systems-engineering/00 Linux Systems Mastery Roadmap.md"
order: 0
---
Purpose: Provide a study and practice path for mastering Linux systems engineering from user space fundamentals through kernel internals, containers, production operations, and eBPF.

# Linux Systems Mastery Roadmap

This roadmap is ordered by operational dependency rather than academic purity. Learn the kernel boundary before eBPF, process state before incident response, memory accounting before container limits, and VFS behavior before debugging storage latency. The goal is to build a mental model that survives production ambiguity.

## Phase 1: Build The Boundary Model

Start with [01 Linux Mental Model User Space Kernel and Hardware](/compendium/linux-systems-engineering/linux-mental-model-user-space-kernel-and-hardware) and [06 System Calls ABI libc and User Kernel Boundaries](/compendium/linux-systems-engineering/system-calls-abi-libc-and-user-kernel-boundaries).

You should be able to explain:

- Why Linux is the kernel while a distribution supplies policy, packaging, service management, and defaults.
- How firmware, bootloader, kernel, initramfs, kernel command line, and PID 1 participate in boot.
- Why user space cannot directly access hardware, page tables, scheduler state, or most privileged CPU instructions.
- How libc wrappers, system call numbers, registers, errno, vDSO, file descriptors, and stable ABI rules shape application behavior.
- Why `/proc`, `/sys`, `/dev`, tmpfs, devtmpfs, and other virtual filesystems are APIs, not ordinary persistent storage.

Practice:

```bash
uname -a
cat /proc/cmdline
cat /proc/self/status
readlink /proc/self/exe
ls -l /proc/self/fd
strace -f -e trace=process,file,network true
systemctl status
```

## Phase 2: Master Processes, Memory, Files, and Networks

Read:

- [02 Processes Threads Scheduling Signals and Jobs](/compendium/linux-systems-engineering/processes-threads-scheduling-signals-and-jobs)
- [03 Memory Virtual Memory Paging Allocators and OOM](/compendium/linux-systems-engineering/memory-virtual-memory-paging-allocators-and-oom)
- [04 Filesystems VFS Block IO Page Cache and Storage](/compendium/linux-systems-engineering/filesystems-vfs-block-io-page-cache-and-storage)
- [05 Linux Networking TCP IP Routing Firewalling and DNS](/compendium/linux-systems-engineering/linux-networking-tcp-ip-routing-firewalling-and-dns)

The key shift is to stop treating command output as the system. `ps`, `top`, `free`, `ip`, `ss`, `df`, `du`, `mount`, and `journalctl` are views over kernel state and user space policy. When views disagree, find the object they are viewing: task, memory cgroup, page cache, inode, mount, socket, route, conntrack entry, unit, or namespace.

Practice labs:

| Lab | Commands | Learning target |
| --- | --- | --- |
| Fork and exec | `strace -f bash -lc 'echo hi | wc -c'` | Shell pipelines create processes, pipes, fd inheritance, and wait relationships. |
| Zombie | Run a tiny parent that does not wait for a child. | Zombies are process table entries waiting for parent collection, not running tasks. |
| Page cache | `dd`, `sync`, `echo 3 &gt; /proc/sys/vm/drop_caches` on a lab host only. | File IO and memory pressure interact through reclaim and cache. |
| Inode exhaustion | Create many tiny files on a disposable filesystem. | Disk free space and inode availability fail independently. |
| Network namespace | `ip netns add lab`, veth pair, bridge, route, `tcpdump`. | Containers are built from the same primitives. |

Production caution:

- Do not drop caches, flush firewall rules, detach mounts, kill process groups, or change sysctls on production hosts without an explicit rollback path.
- Prefer read-only inspection first: `/proc`, `/sys`, `systemctl show`, `journalctl`, `ip -details`, `ss -tinp`, `perf stat`, `bpftool prog show`.

## Phase 3: Operate Services and Security Policy

Read [07 systemd Boot Init Units Timers Journald and Services](/compendium/linux-systems-engineering/systemd-boot-init-units-timers-journald-and-services), [08 Permissions Users Groups Capabilities and LSMs](/compendium/linux-systems-engineering/permissions-users-groups-capabilities-and-lsms), and [12 Linux Security Hardening Secrets and Incident Response](/compendium/linux-systems-engineering/linux-security-hardening-secrets-and-incident-response).

Systemd is not merely a service launcher. It is the user space coordinator for dependency graph activation, cgroup placement, service supervision, logging integration, socket activation, timers, transient units, hardening directives, and resource controls. Security failures often appear as service failures because PID 1, PAM, sudo, capabilities, LSM policy, seccomp, mount permissions, and cgroup placement meet at unit start.

Checklist:

- Can you explain `Requires=` vs `After=` without mixing requirement and ordering?
- Can you find the effective unit after vendor file, administrator override, and runtime drop-ins?
- Can you tell whether a denial came from Unix mode bits, capabilities, SELinux, AppArmor, Landlock, seccomp, readonly mounts, or missing devices?
- Can you harden a service without breaking its needed filesystem, network, or capability access?

## Phase 4: Understand Containers As Linux

Read [09 cgroups Namespaces Containers and Runtime Isolation](/compendium/linux-systems-engineering/cgroups-namespaces-containers-and-runtime-isolation).

Containers are processes with constrained views and constrained resources. Namespaces change what resources look like. Cgroups account and limit resources. Mounts assemble a root filesystem. Capabilities and LSMs reduce privilege. Seccomp filters system calls. Runtimes implement OCI specifications. Kubernetes schedules and configures those primitives through containerd or CRI-O, CNI, CSI, kubelet, and node agents.

Practice:

```bash
unshare --mount --uts --ipc --pid --fork --user --map-root-user bash
cat /proc/self/cgroup
systemd-run --scope -p MemoryMax=200M -p CPUQuota=50% stress-ng --vm 1 --vm-bytes 300M
```

Use local machines for destructive namespace and cgroup experiments. In production clusters, inspect the relationship between pod, container, cgroup, network namespace, and host processes before changing anything.

## Phase 5: Build Observability and Performance Discipline

Read [10 Observability Logs Metrics Tracing and Debugging](/compendium/linux-systems-engineering/observability-logs-metrics-tracing-and-debugging), [11 Performance Engineering perf Flamegraphs and Capacity](/compendium/linux-systems-engineering/performance-engineering-perf-flamegraphs-and-capacity), and [17 Production Operations Troubleshooting and Runbooks](/compendium/linux-systems-engineering/production-operations-troubleshooting-and-runbooks).

Performance work is evidence discipline. First identify the constrained resource, then select the lowest overhead tool that can validate or falsify the hypothesis. Avoid starting with the most powerful tracer because it may require privileges, expose sensitive data, or change timing.

Layered workflow:

1. Ask what changed, what is affected, and what resource is saturated.
2. Check logs and counters for a fast boundary: `journalctl`, `dmesg`, service metrics, `systemctl status`.
3. Inspect live state: `top`, `ps`, `pidstat`, `vmstat`, `iostat`, `ss`, `ip`, `ethtool`, `/proc/pressure/*`.
4. Trace only a bounded target: `strace -p`, `perf record -p`, `bpftrace` one-liners, `tcpdump` with filters.
5. Capture enough evidence for rollback or escalation.

## Phase 6: Learn Kernel Architecture Without Cargo Culting Patches

Read [13 Kernel Architecture Modules Drivers and Device Model](/compendium/linux-systems-engineering/kernel-architecture-modules-drivers-and-device-model).

You do not need to patch the kernel to operate Linux well, but you do need to know what the kernel is doing. Understand monolithic kernel design, modules, devices, VFS, network stack, memory manager, scheduler, RCU, locking, workqueues, softirqs, kernel threads, panics, oops reports, taint flags, config options, and build boundaries.

Production guidance:

- Prefer upstream or distribution-supported kernels for production.
- Treat out-of-tree modules as operational risk: ABI mismatch, taint, crash risk, and upgrade constraints.
- Build custom kernels on learning machines or dedicated lab hosts unless there is a business case and rollback plan.

## Phase 7: Use eBPF As Constrained Kernel Extension

Read:

- [14 eBPF Fundamentals Verifier Maps Programs and Helpers](/compendium/linux-systems-engineering/ebpf-fundamentals-verifier-maps-programs-and-helpers)
- [15 eBPF Networking XDP TC Cilium and Service Dataplanes](/compendium/linux-systems-engineering/ebpf-networking-xdp-tc-cilium-and-service-dataplanes)
- [16 eBPF Observability Uprobes Kprobes Tracepoints and CO-RE](/compendium/linux-systems-engineering/ebpf-observability-uprobes-kprobes-tracepoints-and-co-re)

eBPF is powerful because it lets verified programs run at selected kernel or user space attachment points. It is constrained because the verifier must prove safety, helper availability depends on program type and kernel version, maps are explicit shared state, and production overhead must be bounded. It is not a replacement for logs, metrics, kernel modules, tcpdump, or correct application instrumentation.

Practice sequence:

| Project | Scope | Production lesson |
| --- | --- | --- |
| Trace exec | Trace `sched_process_exec` or syscall execve. | Process events are high value and can leak arguments. |
| TCP connect counter | Count connections by destination with a map. | Cardinality and privacy matter. |
| XDP drop lab | Drop one source IP on a veth pair. | Early packet hooks are fast but bypass later stack context. |
| CO-RE probe | Build a libbpf CO-RE program using BTF. | Portability depends on BTF and field access rules. |
| bpftrace histogram | Create latency histograms for a single function. | Aggregation reduces event volume. |

## Review Checklist

- Can you explain a failure in terms of process, memory, file, network, service, security, cgroup, namespace, or kernel state?
- Can you choose between logs, metrics, tracing, profiling, and packet capture based on risk and question?
- Can you identify when local lab commands are unsafe for production?
- Can you map a Kubernetes symptom back to Linux primitives?
- Can you distinguish eBPF verifier limits from runtime bugs and kernel version gaps?
- Can you produce a rollback plan before changing unit files, firewall rules, cgroup limits, sysctls, mounts, kernel modules, or BPF programs?

## Related Notes

- [Linux Systems Engineering](/compendium/linux-systems-engineering/linux-systems-engineering)
- [17 Production Operations Troubleshooting and Runbooks](/compendium/linux-systems-engineering/production-operations-troubleshooting-and-runbooks)
- [18 Linux Ecosystem Tools and Learning Projects](/compendium/linux-systems-engineering/linux-ecosystem-tools-and-learning-projects)
