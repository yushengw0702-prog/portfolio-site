# 飞书面板同步系统 · 设备配置

在新 Mac 上复刻整套配置。前提：已装好 `lark-cli` 并完成飞书 `auth login`。

## 一键安装后台同步
```bash
bash <(curl -sL https://raw.githubusercontent.com/yushengw0702-prog/portfolio-site/main/device-setup/install.sh)
```
装好：`~/Scripts/` 下的同步脚本 + 本地服务（端口 8787）+ 每天 8:00 定时同步。

## Chrome 扩展（手动一次）
1. 下载 `device-setup/extension/` 文件夹
2. `chrome://extensions` → 开启「开发者模式」→「加载已解压的扩展程序」→ 选该文件夹

## 三类配置怎么同步
| 类别 | 同步方式 |
|---|---|
| 面板本体 + feed.json 数据 | 已在 GitHub，自动同步，无需操作 |
| 扩展字体/背景设置 | manifest 含固定 key → Chrome 账号自动同步 |
| 扩展代码 / 本地脚本 | 本仓库 `device-setup/`，新设备拉一次即可 |
| GitHub token / 飞书授权 | 每台设备本地存（凭证不入库） |
