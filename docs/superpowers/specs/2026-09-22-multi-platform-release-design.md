# Windows x64 + Linux x64/arm64 发布流程设计

## 目标

为 JustRun 建立可重复的 GitHub Actions 发布流程，针对以下桌面目标构建安装包并汇总到同一个 Draft GitHub Release：

| 平台 | Rust target | 产物 |
|---|---|---|
| Windows x64 | `x86_64-pc-windows-msvc` | NSIS `.exe` |
| Linux x64 | `x86_64-unknown-linux-gnu` | `.deb`、`.AppImage` |
| Linux arm64 | `aarch64-unknown-linux-gnu` | `.deb`、`.AppImage` |

本次范围是桌面程序的构建、打包、校验和、Actions artifact 保存及 Draft Release 上传，不把未完成的真机人工走查或 Linux 上的 QEMU/WHPX 运行验收伪装成已完成。

## 现状与约束

- 现有 Windows workflow 已包含授权配置门禁、TypeScript/Vitest/Rust 测试、`qemu-center` 构建、NSIS 构建和 Draft Release 创建。
- 现有 Tauri 配置把 Windows 专用的 `qemu-center.exe` 作为静态 resource；跨平台构建必须改成按 target 注入对应的 `qemu-center` 二进制。
- `qemu-center` 的 WHPX、DISM 和 Windows QEMU 安装路径是 Windows 专用能力。Linux 包应携带 Linux 版本的 CLI，但发布说明必须保留平台能力边界。
- 发布 job 只能读取 GitHub Actions Variables/Secrets；服务端 signing key 不得进入桌面构建环境。
- 当前仓库有未提交修改，本次只修改发布流程直接涉及的文件，不覆盖或清理其它工作区修改。

## 方案

### 1. 单一发布 workflow、矩阵构建

新增统一的 `release.yml`，以 `vMAJOR.MINOR.PATCH` tag 为正式触发入口，并保留 `workflow_dispatch` 供构建验证。矩阵 job 分别使用 Windows x64、Ubuntu x64 和 Ubuntu arm64 runner。

每个矩阵 job：

1. checkout 指定 tag/commit；
2. 安装 Node.js 20、Rust stable 和 Linux Tauri 系统依赖；
3. 校验版本与 `RDC_AUTH_*` 发布配置；
4. 构建匹配 target 的 `qemu-center`；
5. 把匹配 target 的 `qemu-center` 放入临时 Tauri resource 目录；
6. 运行 Tauri 构建并只生成该平台所需 bundle；
7. 为安装包生成带平台/架构名称的文件和 SHA256 清单；
8. 上传 Actions artifact。

Windows job 继续执行现有授权服务测试、旋转契约检查、前端检查和两套 Rust 测试。Linux 构建 job 也执行与发布包相关的编译门禁，避免 arm64 只上传一个未验证的空壳包。

### 2. 平台资源注入

从基础 `tauri.conf.json` 删除静态 Windows `qemu-center.exe` resource；发布 workflow 在构建前创建短生命周期的 target-specific overlay/resource：

- Windows 映射为 `qemu-center/qemu-center.exe`；
- Linux 映射为 `qemu-center/qemu-center`。

构建结束后删除临时资源。开发态仍通过现有仓库 target 目录和 `QEMU_CENTER_BIN` 查找逻辑解析 CLI，不改变开发运行方式。

### 3. Release 汇总

新增 `publish` job，依赖全部矩阵 job：

- 下载全部矩阵 artifact；
- 统一生成 `SHA256SUMS.txt` 和简短的 Beta 发布说明；
- tag 触发时创建或更新 Draft Release 并上传所有安装包；
- 手动触发只保留 Actions artifact，避免没有正式 tag 时误创建 Release。

Release 明确标注当前包为 unsigned，除非仓库后续提供真实签名证书配置；不把 GitHub Actions artifact retention 当作 Release 附件。

## 错误边界

- 缺少 `RDC_AUTH_BASE_URL`、执行 release URL 或公钥环时，所有正式 package job 在编译前失败。
- 缺少 Linux Tauri 系统依赖、target 二进制或 bundle 文件时，job 失败，不上传伪成功 artifact。
- 任一矩阵 job 失败时，publish job 不创建/更新 Release。
- 不新增 Windows ARM64 或 Android arm64 产物；它们不在本次范围内。
- Linux 产物可声明为 Linux x64/arm64 desktop package，不声明 WHPX、Windows 便携 QEMU 或真机 QEMU 验收已通过。

## 验证标准

自动验证：

- `npx tsc --noEmit`
- `npx vitest run`
- `cargo test --manifest-path src-tauri/Cargo.toml`
- `cargo test --manifest-path qemu-center/Cargo.toml`
- Windows x64、Linux x64、Linux arm64 三个 target 的 `qemu-center` release 编译
- 每个平台至少生成预期的 bundle 文件，并生成非空 SHA256 清单
- workflow 的 tag/manual 分支行为和 publish 条件可静态检查

人工验证边界：

- GitHub repository variables 的实际配置；
- 三个平台安装、启动、卸载和桌面视觉；
- Linux 主机 Docker/binder/QEMU 环境；
- Windows 签名证书、SmartScreen 和正式 updater 配置；
- P7-1 真机人工走查。

