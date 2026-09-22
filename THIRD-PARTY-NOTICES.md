# Third-party notices

JustRun 的自有代码按根目录 `LICENSE` 中的 MIT License 发布。本文件列出仓库源码中引用的第三方项目，以及本仓库当前对本地二进制资产的分发边界。

## 当前仓库中的源码或接口引用

| 项目 | 用途 | 上游许可证/来源 | 当前处理 |
|---|---|---|---|
| Zygisk API header | `vendor/zygisk-module/src/zygisk.hpp` | [topjohnwu/zygisk-module-sample](https://github.com/topjohnwu/zygisk-module-sample)，上游说明为 0BSD | 保留来源说明；该头文件不按根目录 MIT 重新声明 |
| Magisk API / 运行时参考 | Magisk 预装与脚本说明 | [topjohnwu/Magisk](https://github.com/topjohnwu/Magisk)，GPL-3.0 | 二进制下载产物不进入 Git；使用、修改和再分发须遵守上游许可证 |
| LSPosed | Zygisk 模块参考和本地模块集成 | [LSPosed/LSPosed](https://github.com/LSPosed/LSPosed)，GPL-3.0 | 本仓库不把上游发布 zip 提交到 Git |
| Gnirehtet | 反向网络连接说明 | [Genymobile/gnirehtet](https://github.com/Genymobile/gnirehtet)，Apache-2.0 | 仅记录下载来源；运行时 archive 由用户自行获取 |
| redroid-script | Magisk/GApps 集成思路参考 | [ayasa520/redroid-script](https://github.com/ayasa520/redroid-script)，MIT | 仅作参考来源；具体派生代码仍需按文件保留来源说明 |

## 不随公开仓库分发的本地资产

以下资产被 `.gitignore` 忽略，当前仓库不授予它们任何额外分发权：

- MindTheGapps：包含 Google 专有组件。仓库只保留下载映射和说明，不提交 zip；使用者应从上游获取并自行确认条款。
- Magisk fork APK、native binaries、LSPosed/Shamiko module zips：只作为本地构建输入；Magisk/LSPosed 的许可证不能自动覆盖 fork、构建产物或 Shamiko 发布物。没有逐项确认前，不得放入 GitHub Release 或安装包。
- `vendor/test-apk/DeskClock.apk`：本地测试 APK 不进入公开仓库。AOSP DeskClock 源码文件通常带 Apache-2.0 声明，但当前 APK 的确切构建来源和完整依赖清单未在本仓库核验，因此不作为可再分发资产。
- `vendor/magisk/rdc-resign.keystore`：本地重签私钥，必须放在仓库外，不能随源码或 Release 分发。

## 分发规则

如果未来要把上述任一二进制放入 GitHub Release 或安装包，必须先完成对应版本的上游许可证、版权声明、NOTICE 和再分发权核验，并在发布物中附带要求的文本。根目录 MIT License 只覆盖 JustRun 自有代码，不覆盖这些第三方资产。
