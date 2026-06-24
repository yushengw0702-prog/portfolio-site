#!/bin/bash
# install.sh — 在新 Mac 上一键安装飞书面板同步系统
# 用法：bash <(curl -sL https://yushengw0702-prog.github.io/portfolio-site/device-setup/install.sh)
set -euo pipefail

BASE="https://raw.githubusercontent.com/yushengw0702-prog/portfolio-site/main/device-setup"
echo "▶ 安装飞书面板同步系统…"

# 0. 前置检查
echo "  检查 lark-cli…"
LARK=$(command -v lark-cli || echo "$HOME/.local/bin/lark-cli")
[ -x "$LARK" ] || { echo "✗ 未找到 lark-cli，请先装好并完成 auth login"; exit 1; }

echo "  检查飞书授权…"
"$LARK" auth status 2>/dev/null | grep -qi "user\|search:docs" || echo "  ⚠ 飞书可能未授权 docx 读取权限，稍后若同步失败请运行：lark-cli auth login --scope \"docx:document:readonly\""

echo "  检查 GitHub token（来自 GitHub Desktop 登录）…"
if ! security find-generic-password -s "GitHub - https://api.github.com" -a "yushengw0702-prog" -w >/dev/null 2>&1; then
  echo "  ⚠ Keychain 里没有 GitHub token。请在这台 Mac 上装 GitHub Desktop 并登录 yushengw0702-prog 账号，"
  echo "    或手动把 PAT 存进 Keychain。没有它，自动 push 不可用（但面板只读仍正常）。"
fi

# 1. 脚本
mkdir -p "$HOME/Scripts"
echo "  下载脚本到 ~/Scripts …"
curl -sfL "$BASE/scripts/sync-feed.sh"   -o "$HOME/Scripts/sync-feed.sh"
curl -sfL "$BASE/scripts/sync-server.py" -o "$HOME/Scripts/sync-server.py"
chmod +x "$HOME/Scripts/sync-feed.sh"

# 2. LaunchAgents（按本机 $HOME 动态生成）
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$HOME/Library/LaunchAgents/com.yushengw.sync-server.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.yushengw.sync-server</string>
  <key>ProgramArguments</key><array><string>/usr/bin/python3</string><string>$HOME/Scripts/sync-server.py</string></array>
  <key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$HOME/Scripts/sync-server.log</string>
  <key>StandardErrorPath</key><string>$HOME/Scripts/sync-server.log</string>
</dict></plist>
EOF

cat > "$HOME/Library/LaunchAgents/com.yushengw.sync-feed.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.yushengw.sync-feed</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$HOME/Scripts/sync-feed.sh</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>8</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>$HOME/Scripts/sync-feed.log</string>
  <key>StandardErrorPath</key><string>$HOME/Scripts/sync-feed.log</string>
</dict></plist>
EOF

# 3. 加载服务
for p in com.yushengw.sync-server com.yushengw.sync-feed; do
  launchctl unload "$HOME/Library/LaunchAgents/$p.plist" 2>/dev/null || true
  launchctl load "$HOME/Library/LaunchAgents/$p.plist"
done

echo ""
echo "✅ 后台服务装好了。验证本地服务："
sleep 2
curl -s "http://127.0.0.1:8787/sync?token=fp-sync-2026" | python3 -c "import sys,json; d=json.load(sys.stdin); print('  同步测试:', 'OK ✓' if d.get('ok') else '失败 — '+str(d.get('stderr','')))" 2>/dev/null || echo "  服务未就绪，可查看 ~/Scripts/sync-server.log"

echo ""
echo "──────────────────────────────────────────"
echo "还差最后一步（手动）：在 Chrome 里加载扩展"
echo "  1. 把 device-setup/extension/ 文件夹下载到本机"
echo "  2. Chrome → chrome://extensions → 打开右上「开发者模式」"
echo "  3. 点「加载已解压的扩展程序」→ 选 extension 文件夹"
echo "  （已带固定 key，扩展 ID 和另一台一致，字体/背景设置会跟着 Chrome 账号同步）"
echo "──────────────────────────────────────────"
