#!/bin/bash
# sync-feed.sh — 从飞书「工作区-6月份」实时同步到 portfolio-site os/feed.json
# 规则：文档里的一级标题(H1) = 面板上的小标签；标题下方紧跟的子文档 = 该标签下的条目
set -euo pipefail

LARK_CLI=$(command -v lark-cli || echo "$HOME/.local/bin/lark-cli")
DOC_TOKEN="Nyx2d9M8zoCt5LxcUmsctrxZnxf"
REPO="yushengw0702-prog/portfolio-site"
FILE_PATH="os/feed.json"
LAST_FEED="$HOME/Scripts/last-feed.json"

TMP_RAW=$(mktemp); TMP_FEED=$(mktemp)
trap "rm -f $TMP_RAW $TMP_FEED" EXIT

"$LARK_CLI" api GET "/open-apis/docx/v1/documents/$DOC_TOKEN/blocks" \
  --as user --params '{"page_size":500,"document_revision_id":-1}' --format json > "$TMP_RAW"

RAW="$TMP_RAW" python3 << 'PYEOF' > "$TMP_FEED"
import json, datetime, os
with open(os.environ["RAW"]) as f: d = json.load(f)
items = d.get('data', {}).get('items', [])
def get_elements(b):
    txt=''; docs=[]
    for k in ('text','heading1','heading2','heading3','heading4','heading5','bullet','ordered'):
        if k in b and b[k]:
            for e in b[k].get('elements', []):
                if e.get('text_run'): txt += e['text_run'].get('content','')
                md=e.get('mention_doc')
                if md:
                    t=(md.get('title') or '').strip(); u=md.get('url','')
                    if t and u: docs.append({'title':t,'url':u})
            break
    return txt.strip(), docs
groups=[]; cur=None
for b in items:
    if b.get('block_type')==3:
        t,_=get_elements(b)
        if t: cur={'heading':t,'docs':[]}; groups.append(cur)
    else:
        _,docs=get_elements(b)
        if docs:
            if cur is None: cur={'heading':'未分类','docs':[]}; groups.append(cur)
            cur['docs'].extend(docs)
feed={'generated_at':datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
      'source':{'url':'https://my.feishu.cn/wiki/ELCQwN0p7ihY2qkrsOJcmC1knCZ'},
      'groups':[g for g in groups if g['docs']]}
print(json.dumps(feed, ensure_ascii=False, indent=2))
PYEOF

cp "$TMP_FEED" "$LAST_FEED"

FEED_FILE="$TMP_FEED" REPO="$REPO" FILE_PATH="$FILE_PATH" python3 << 'PYEOF'
import json, base64, urllib.request, subprocess, os
TOKEN=subprocess.check_output(['security','find-generic-password','-s','GitHub - https://api.github.com','-a','yushengw0702-prog','-w'],text=True).strip()
REPO=os.environ["REPO"]; FILE_PATH=os.environ["FILE_PATH"]
raw=open(os.environ["FEED_FILE"],'rb').read()
if not raw.strip(): raise SystemExit("feed.json 为空，中止")
try:
    req=urllib.request.Request(f'https://api.github.com/repos/{REPO}/contents/{FILE_PATH}',headers={'Authorization':f'token {TOKEN}','Accept':'application/vnd.github.v3+json'})
    sha=json.load(urllib.request.urlopen(req)).get('sha','')
except Exception: sha=''
payload={'message':'sync: update feed.json from Feishu','content':base64.b64encode(raw).decode()}
if sha: payload['sha']=sha
req=urllib.request.Request(f'https://api.github.com/repos/{REPO}/contents/{FILE_PATH}',data=json.dumps(payload).encode(),headers={'Authorization':f'token {TOKEN}','Content-Type':'application/json','Accept':'application/vnd.github.v3+json'},method='PUT')
print("sync ok | SHA:", json.load(urllib.request.urlopen(req))['content']['sha'][:8])
PYEOF
