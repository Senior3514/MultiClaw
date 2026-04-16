#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import sys

WEB_ROOT = Path(__file__).resolve().parent.parent / "web"
HOST = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1"
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8813


class NoCacheHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    server = HTTPServer((HOST, PORT), NoCacheHandler)
    print(f"Serving MultiClaw on http://{HOST}:{PORT}")
    server.serve_forever()
