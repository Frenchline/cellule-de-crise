#!/usr/bin/env python3
"""Serveur de délai pour tests/audiocheck.html?levels.

GET /wait.png?s=N dort N secondes puis renvoie un GIF 1x1.
La page l'inclut en <img> : le load (et donc --dump-dom headless)
est retardé, ce qui laisse l'AudioContext tourner en temps réel
pendant les mesures de niveau. Port 8099, usage tests uniquement.

    python3 tools/audiowait.py
"""
import http.server
import time
import urllib.parse

GIF = (b'GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00\x00'
       b'!\xf9\x04\x00\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00'
       b'\x02\x02D\x01\x00;')


class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        n = min(30, float(q.get('s', ['10'])[0]))
        time.sleep(n)
        self.send_response(200)
        self.send_header('Content-Type', 'image/gif')
        self.send_header('Content-Length', str(len(GIF)))
        self.end_headers()
        self.wfile.write(GIF)

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    http.server.HTTPServer(('127.0.0.1', 8099), H).serve_forever()
