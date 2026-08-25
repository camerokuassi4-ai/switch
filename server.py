import http.server
import socketserver
import os
import urllib.parse

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class SwitchFintechHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')

        # 1. Exact match
        local_path = os.path.join(DIRECTORY, path.lstrip('/'))
        if os.path.isfile(local_path):
            return super().do_GET()

        # 2. Path ending in /code -> try /code.html
        if path.endswith('/code'):
            candidate = os.path.join(DIRECTORY, path.lstrip('/') + '.html')
            if os.path.isfile(candidate):
                self.path = path + '.html'
                if parsed.query:
                    self.path += '?' + parsed.query
                return super().do_GET()

        # 3. Path is directory name -> try /path/code.html
        if path:
            candidate_code = os.path.join(DIRECTORY, path.lstrip('/'), 'code.html')
            if os.path.isfile(candidate_code):
                self.path = path + '/code.html'
                if parsed.query:
                    self.path += '?' + parsed.query
                return super().do_GET()

            # Path without .html -> try path + .html
            candidate_html = os.path.join(DIRECTORY, path.lstrip('/') + '.html')
            if os.path.isfile(candidate_html):
                self.path = path + '.html'
                if parsed.query:
                    self.path += '?' + parsed.query
                return super().do_GET()

        # 4. Root
        if not path or path == '':
            self.path = '/index.html'
            return super().do_GET()

        return super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('0.0.0.0', PORT), SwitchFintechHandler) as httpd:
        print(f"🚀 Serveur Switch Bénin démarré sur http://localhost:{PORT}")
        print(f"📂 Répertoire racine: {DIRECTORY}")
        httpd.serve_forever()
