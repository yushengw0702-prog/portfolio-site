#!/usr/bin/env python3
# 抓取「工作区」wiki 节点的子文档树 -> feed.json
# 供个人系统控制台读取渲染。
import json, subprocess, sys, datetime, os

ROOT_TOKEN = "ELCQwN0p7ihY2qkrsOJcmC1knCZ"   # 工作区-X 月份
SPACE_ID   = "7644574235389611229"            # 【足印】执行计划
WIKI_BASE  = "https://my.feishu.cn/wiki/"
MAX_DEPTH  = 5

def list_children(token):
    """调用 lark-cli 列出某节点的直接子节点。"""
    try:
        out = subprocess.run(
            ["lark-cli", "wiki", "+node-list",
             "--space-id", SPACE_ID,
             "--parent-node-token", token, "--json"],
            capture_output=True, text=True, timeout=30
        ).stdout
        # 首行是人类可读提示，跳过到第一个 '{'
        i = out.find("{")
        if i < 0:
            return []
        data = json.loads(out[i:])
        return data.get("data", {}).get("nodes", [])
    except Exception as e:
        sys.stderr.write(f"warn: {token}: {e}\n")
        return []

def walk(token, depth):
    nodes = list_children(token)
    items = []
    for n in nodes:
        item = {
            "title": n.get("title", "(无标题)"),
            "token": n.get("node_token", ""),
            "url": WIKI_BASE + n.get("node_token", ""),
            "children": []
        }
        if n.get("has_child") and depth < MAX_DEPTH:
            item["children"] = walk(n["node_token"], depth + 1)
        items.append(item)
    return items

def main():
    tree = walk(ROOT_TOKEN, 0)
    feed = {
        "generated_at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "root": {"title": "工作区", "url": WIKI_BASE + ROOT_TOKEN},
        "items": tree,
    }
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "feed.json"), "w", encoding="utf-8") as f:
        json.dump(feed, f, ensure_ascii=False, indent=2)
    n = sum(1 for _ in json.dumps(feed))  # noop
    print("feed.json written:", len(tree), "top-level groups,",
          feed["generated_at"])

if __name__ == "__main__":
    main()
