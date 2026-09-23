# Windows Background Process Windows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop Windows console windows from appearing when JustRun launches captured background CLI processes, without changing interactive terminal behavior.

**Architecture:** Add a shared no-console command configurator to the Tauri process helper and use it in the direct QEMU CLI/probe process paths. Prove the observable Windows behavior with real PowerShell child-process tests that check `GetConsoleWindow()` while verifying captured output remains available.

**Tech Stack:** Rust 2021, `std::process::Command`, Windows `CommandExt`, existing Cargo test suites.

**Spec:** `docs/superpowers/specs/2026-09-23-windows-background-process-windows.md`

## Global Constraints

- Only captured/background child processes get `CREATE_NO_WINDOW` on Windows.
- Explicitly opened interactive PowerShell/cmd sessions remain visible and unchanged.
- Do not suppress GUI windows owned by child applications.
- Non-Windows platforms use a no-op configuration function.
- Leave `qemu-center` unchanged; its captured process runner already applies `CREATE_NO_WINDOW`.
- Follow the repository gates: TypeScript, Vitest, Tauri Rust tests, and qemu-center Rust tests.

## Review Focus

- Captured PowerShell child must have no console while its captured stdout remains available; covered by the `util` Windows behavior test.
- Directly spawned `qemu-center` CLI must also have no console and retain its output; covered by the `qemu::run_cli_at` Windows behavior test.
- Explicit interactive PowerShell/cmd terminal must remain visible; verify `terminal_session` is unchanged by diff review and existing Tauri tests.
- Non-Windows builds must not reference Windows-only APIs; verify with the full Rust suites and release CI target compilation.
- GUI children must retain their own GUI behavior; the change only adds a console creation flag and must not set `DETACHED_PROCESS` or suppress/redirect their app-owned window.

---

### Task 1: Add observable Windows regression tests

**Files:**
- Add: `src-tauri/tests/windows_background_processes.rs`

**Interfaces:**
- Consumes: Existing `run_command_timeout` and `run_cli_at` entry points.
- Produces: Windows-only GUI-subsystem integration tests that assert spawned PowerShell processes return a zero console-window handle and that captured output remains available.

- [x] **Step 1: Add Windows GUI-subsystem integration tests for both captured process entry points.**

Run PowerShell with `-NoLogo -NoProfile -NonInteractive -Command` and this script:

```powershell
Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class ConsoleWindowProbe { [DllImport("kernel32.dll")] public static extern IntPtr GetConsoleWindow(); }'; [ConsoleWindowProbe]::GetConsoleWindow().ToInt64()
```

The integration-test executable uses the Windows GUI subsystem to match the installed Tauri app's no-console parent. Assert success, stdout exactly `0`, and a stderr marker for both `util::run_command_timeout` and `qemu::run_cli_at`.

- [x] **Step 2: Run the focused test and confirm it fails for the console-window assertion before the fix.**

Run: `cargo test --manifest-path src-tauri/Cargo.toml --test windows_background_processes -- --nocapture`

Expected: FAIL at both console-window assertions because the children allocate consoles from this GUI-subsystem parent; PowerShell launch and captured stdout succeed.

### Task 2: Suppress consoles for background process helpers

**Files:**
- Modify: `src-tauri/src/services/util.rs`
- Modify: `src-tauri/src/services/qemu.rs`

**Interfaces:**
- Consumes: `std::process::Command` and existing command helpers.
- Produces: `pub(super) fn hide_console_window(command: &mut Command)` in `util`; Windows sets `CREATE_NO_WINDOW` and other platforms do nothing.

- [x] **Step 1: Implement the minimal shared helper in `util.rs`.**

Use `#[cfg(windows)]` to call `creation_flags(0x0800_0000)` and a `#[cfg(not(windows))]` no-op. Apply it in `util::command` so timeout, byte, stdin, cancellable, and direct service processes created through this factory all follow the policy.

- [x] **Step 2: Apply the shared helper to direct QEMU process creation.**

Use it for the command discovery probe, `run_cli_at`, and the timeout-only `taskkill` process. Also apply it to `util`'s timeout-only `taskkill`. Do not change `terminal_session` or any user-facing terminal launch code.

- [x] **Step 3: Rerun the focused Windows integration test.**

Run: `cargo test --manifest-path src-tauri/Cargo.toml --test windows_background_processes -- --nocapture`

Expected: both PASS, stdout remains `0`, stderr contains the marker, and exit status remains successful.

### Task 3: Verify repository gates and inspect the final diff

**Files:**
- Review: `docs/superpowers/specs/2026-09-23-windows-background-process-windows.md`
- Review: `docs/superpowers/plans/2026-09-23-windows-background-process-windows.md`
- Review: `src-tauri/src/services/util.rs`
- Review: `src-tauri/src/services/qemu.rs`
- Review: `src-tauri/tests/windows_background_processes.rs`

- [x] **Step 1: Run TypeScript and frontend tests.**

Run: `npx tsc --noEmit`

Run: `npx vitest run`

Expected: both exit 0.

- [x] **Step 2: Run both Rust test suites.**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Run: `cargo test --manifest-path qemu-center/Cargo.toml`

Expected: both exit 0 with zero failures.

- [x] **Step 3: Inspect the diff and confirm scope.**

Run: `git diff --check`

Run: `git status --short`

Run: `git diff -- docs/superpowers/specs/2026-09-23-windows-background-process-windows.md docs/superpowers/plans/2026-09-23-windows-background-process-windows.md src-tauri/src/services/util.rs src-tauri/src/services/qemu.rs`

Expected: only these two docs, the two Rust service files, and the Windows regression test are changed; no interactive terminal code or unrelated feature code changes.
