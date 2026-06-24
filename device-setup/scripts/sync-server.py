#!/usr/bin/env python3
# 本地常驻服务，监听 127.0.0.1:8787，面板点「同步」时触发 sync-feed.sh 并回传最新数据
import subprocess, json, os
from http.server import BaseHTTPRequestHandler, HTTPServer
PORT=8787
SCRIPT=os.path.expanduser("~/Scripts/sync-feed.sh")
LAST_FEED=os.path.expanduser("~/Scripts/last-feed.json")
TOKEN="fp-sync-2026"
ALLOW_ORIGIN="https://yushengw0702-prog.github.io"
class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin",ALLOW_ORIGIN)
        self.send_header("Access-Control-Allow-Methods","GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers","Content-Type")
        self.send_header("Access-Control-Allow-Private-Network","true")
    def do_OPTIONS(self): self.send_response(204); self._cors(); self.end_headers()
    def _send(self,c,o):
        b=json.dumps(o).encode(); self.send_response(c); self._cors()
        self.send_header("Content-Type","application/json"); self.end_headers(); self.wfile.write(b)
    def do_GET(self): self._h()
    def do_POST(self): self._h()
    def _h(self):
        if not self.path.startswith("/sync"): return self._send(404,{"ok":False})
        if f"token={TOKEN}" not in self.path: return self._send(403,{"ok":False,"error":"bad token"})
        try:
            out=subprocess.run(["/bin/bash",SCRIPT],capture_output=True,text=True,timeout=60)
            ok=out.returncode==0; feed=None
            if ok:
                try: feed=json.load(open(LAST_FEED))
                except Exception: feed=None
            self._send(200 if ok else 500,{"ok":ok,"feed":feed,"stdout":out.stdout.strip()[-300:],"stderr":out.stderr.strip()[-300:]})
        except subprocess.TimeoutExpired: self._send(504,{"ok":False,"error":"timeout"})
        except Exception as e: self._send(500,{"ok":False,"error":str(e)})
    def log_message(self,*a): pass
if __name__=="__main__": HTTPServer(("127.0.0.1",PORT),H).serve_forever()
