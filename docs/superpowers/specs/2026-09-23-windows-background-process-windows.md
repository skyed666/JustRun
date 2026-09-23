# Windows 后台子进程不显示控制台

## 问题

Windows 发布版的 Tauri 主程序是 GUI 子系统程序，但 Rust 后端会直接启动 PowerShell、`qemu-center`、Docker/ADB 等控制台程序。现有启动路径没有统一设置 `CREATE_NO_WINDOW`，因此 Windows 可能为这些后台子进程创建可见控制台。运行时检查和定时资源采样会反复调用它们，表现为启动应用后空白终端窗口连续弹出。

## 目标

- 后台调用且由 JustRun 捕获标准输入/输出的外部命令，在 Windows 上不显示控制台窗口。
- 仍完整捕获子进程 stdout/stderr、退出码和超时结果。
- 用户显式打开的 PowerShell/cmd 交互终端继续可见。
- 非 Windows 平台行为不变。
- 不隐藏外部 GUI 程序自己的窗口；仅禁止额外控制台窗口。

## 设计

1. 在 `src-tauri/src/services/util.rs` 提供一个跨平台 no-op/Windows 专用的命令配置函数：Windows 调用 `std::os::windows::process::CommandExt::creation_flags(CREATE_NO_WINDOW)`，其它平台不做处理。
2. 将该配置用于 `util::command` 工厂，使经该工厂启动的后台服务进程共用同一策略；不直接从此工厂启动的交互终端入口不受影响。
3. 对 `src-tauri/src/services/qemu.rs` 中直接创建的探测命令、`qemu-center` 子进程和超时清理命令显式使用相同策略。
4. 不改 `qemu-center` crate：其 `exec.rs` 已对捕获输出的命令应用 `CREATE_NO_WINDOW`，且 QEMU daemon 启动已有独立的 detached 标志。

## 验收标准

- Windows GUI 子系统集成测试通过：经 `util` 捕获命令路径启动的 PowerShell 子进程报告 `GetConsoleWindow() == 0`。
- Windows GUI 子系统集成测试通过：经 `qemu::run_cli_at` 启动的 PowerShell 子进程也没有控制台窗口，stdout/stderr 仍可读取。
- `terminal_session` 的用户交互式终端启动策略没有改变。
- Linux/macOS 编译及既有行为不变。
- `npx tsc --noEmit`、`npx vitest run`、`cargo test --manifest-path src-tauri/Cargo.toml`、`cargo test --manifest-path qemu-center/Cargo.toml` 全部通过。
- 发布 Windows 包后人工确认启动应用及进入 QEMU 页面不再弹出控制台；这项视觉验收仍需在用户机器确认。
