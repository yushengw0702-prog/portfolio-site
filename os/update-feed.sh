#!/bin/bash
# 抓取飞书工作区子文档树 -> feed.json -> 推送到 GitHub Pages
# 用法：手动 ./update-feed.sh ，或由 launchd 每晚定时调用。
set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
export PATH="$HOME/bin:$PATH"

DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$DIR/.." && pwd)"

echo "[$(date '+%F %T')] 生成 feed.json ..."
python3 "$DIR/update-feed.py"

cd "$REPO"
if git diff --quiet -- os/feed.json; then
  echo "无变化，跳过推送。"
  exit 0
fi

git add os/feed.json
git commit -m "chore: sync workspace feed $(date '+%F %H:%M')" >/dev/null
git push >/dev/null
echo "已推送最新 feed.json"
