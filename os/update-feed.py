#!/usr/bin/env python3
# 解析飞书「工作区」文档正文 -> feed.json
# 数据源 = 文档正文里的「大标题(H) + 标题下内联引用的文档(@文档)」，
# 而不是 wiki 文件树里的子节点。
import json, subprocess, sys, datetime, os, re

DOC_TOKEN  = "Nyx2d9M8zoCt5LxcUmsctrxZnxf"                 # 工作区文档 docx token
SOURCE_URL = "https://my.feishu.cn/wiki/ELCQwN0p7ihY2qkrsOJcmC1knCZ"
FS_BASE    = "https://my.feishu.cn/"

TAG_RE  = re.compile(r'<h([1-9])>(.*?)</h\1>|<cite\b([^>]*?)></cite>', re.S)
ATTR_RE = re.compile(r'([\w-]+)="([^"]*)"')
STRIP   = re.compile(r'<[^>]+>')

def fetch_content():
    out = subprocess.run(
        ["lark-cli", "docs", "+fetch", "--doc", DOC_TOKEN, "--json"],
        capture_output=True, text=True, timeout=40
    ).stdout
    i = out.find("{")
    data = json.loads(out[i:])
    return data["data"]["document"]["content"]

def doc_url(file_type, doc_id):
    seg = "wiki" if file_type == "wiki" else (file_type or "docx")
    return FS_BASE + seg + "/" + doc_id

def parse(content):
    groups = []
    current = None
    for m in TAG_RE.finditer(content):
        if m.group(1):  # 标题
            current = {"level": int(m.group(1)),
                       "heading": STRIP.sub("", m.group(2)).strip() or "（未命名标题）",
                       "docs": []}
            groups.append(current)
        else:           # cite
            attrs = dict(ATTR_RE.findall(m.group(3)))
            if attrs.get("type") != "doc":
                continue
            did = attrs.get("doc-id", "")
            if not did:
                continue
            doc = {"title": (attrs.get("title", "") or "").strip() or "无标题文档",
                   "url": doc_url(attrs.get("file-type", "wiki"), did)}
            if current is None:        # 标题之前出现的引用
                current = {"level": 1, "heading": "（未分组）", "docs": []}
                groups.append(current)
            current["docs"].append(doc)
    # 丢弃完全空的标题组？保留——空标题组也展示，提示用户该分类暂无文档
    return groups

def main():
    content = fetch_content()
    groups = parse(content)
    feed = {
        "generated_at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "source": {"title": "工作区", "url": SOURCE_URL},
        "groups": groups,
    }
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "feed.json"), "w", encoding="utf-8") as f:
        json.dump(feed, f, ensure_ascii=False, indent=2)
    total = sum(len(g["docs"]) for g in groups)
    print(f"feed.json written: {len(groups)} 个标题分组, {total} 个文档, {feed['generated_at']}")

if __name__ == "__main__":
    main()
