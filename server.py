import http.server
import socketserver
import os
import urllib.parse
import json
import sqlite3
import random
from datetime import datetime

# Import database module
from backend.db import get_connection, hash_pin, init_database

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Change to working directory
os.chdir(DIRECTORY)

# Ensure database is up to date on launch
init_database()

class SwitchFintechHandler(http.server.SimpleHTTPRequestHandler):

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path.rstrip('/')

            # ── REST API ROUTES (GET) ─────────────────────────────
            if path == '/api/user/wallet':
                conn = get_connection()
                user = conn.execute("SELECT * FROM users WHERE phone = '+229 97 12 34 56'").fetchone()
                conn.close()
                if user:
                    return self._send_json({
                        "success": True,
                        "phone": user["phone"],
                        "full_name": user["full_name"],
                        "email": user["email"],
                        "balance": user["balance"],
                        "vault_balance": user["vault_balance"],
                        "kyc_level": user["kyc_level"],
                        "rib": user["rib_uemoa"]
                    })
                return self._send_json({"error": "Utilisateur non trouvé"}, 404)

            if path == '/api/transactions':
                conn = get_connection()
                txs = conn.execute("SELECT * FROM transactions ORDER BY id DESC LIMIT 50").fetchall()
                conn.close()
                return self._send_json({
                    "success": True,
                    "transactions": [dict(tx) for tx in txs]
                })

            if path == '/api/agents/cashpoints':
                conn = get_connection()
                points = conn.execute("SELECT * FROM cashpoints WHERE is_open = 1").fetchall()
                conn.close()
                return self._send_json({
                    "success": True,
                    "total": len(points),
                    "cashpoints": [dict(p) for p in points]
                })

            if path == '/api/agent/stats':
                conn = get_connection()
                agent = conn.execute("SELECT * FROM agents WHERE agent_code = 'AGT-4092'").fetchone()
                conn.close()
                if agent:
                    return self._send_json({
                        "success": True,
                        "agent": dict(agent)
                    })
                return self._send_json({"error": "Agent non trouvé"}, 404)

            # ── STATIC HTML & SPA SERVING ──────────────────────────
            local_path = os.path.join(DIRECTORY, path.lstrip('/'))
            if os.path.isfile(local_path):
                return super().do_GET()

            if path.endswith('/code'):
                candidate = os.path.join(DIRECTORY, path.lstrip('/') + '.html')
                if os.path.isfile(candidate):
                    self.path = path + '.html'
                    if parsed.query:
                        self.path += '?' + parsed.query
                    return super().do_GET()

            if path:
                candidate_code = os.path.join(DIRECTORY, path.lstrip('/'), 'code.html')
                if os.path.isfile(candidate_code):
                    self.path = path + '/code.html'
                    if parsed.query:
                        self.path += '?' + parsed.query
                    return super().do_GET()

                candidate_html = os.path.join(DIRECTORY, path.lstrip('/') + '.html')
                if os.path.isfile(candidate_html):
                    self.path = path + '.html'
                    if parsed.query:
                        self.path += '?' + parsed.query
                    return super().do_GET()

            if not path or path == '':
                self.path = '/index.html'
                return super().do_GET()

            return super().do_GET()
        except Exception as e:
            print("ERROR in do_GET:", e)
            import traceback
            traceback.print_exc()
            self._send_json({"error": str(e)}, 500)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        # ── REST API ROUTES (POST) ────────────────────────────

        # 1. Vérification PIN
        if path == '/api/auth/verify-pin':
            pin = payload.get('pin', '')
            conn = get_connection()
            user = conn.execute("SELECT * FROM users WHERE phone = '+229 97 12 34 56'").fetchone()
            conn.close()
            if user and user['pin_hash'] == hash_pin(pin):
                return self._send_json({"success": True, "token": "SW-AUTH-TOKEN-2026"})
            return self._send_json({"success": False, "error": "Code PIN incorrect"}, 401)

        # 2. Transfert P2P Switch
        if path == '/api/transactions/transfer':
            amount = int(payload.get('amount', 0))
            recipient = payload.get('recipient', '')
            note = payload.get('note', 'Transfert Switch')

            if amount <= 0:
                return self._send_json({"success": False, "error": "Montant invalide"}, 400)

            conn = get_connection()
            user = conn.execute("SELECT * FROM users WHERE phone = '+229 97 12 34 56'").fetchone()
            if not user or user['balance'] < amount:
                conn.close()
                return self._send_json({"success": False, "error": "Solde insuffisant"}, 400)

            # Débit
            new_balance = user['balance'] - amount
            conn.execute("UPDATE users SET balance = ? WHERE id = ?", (new_balance, user['id']))

            # Écriture comptable
            tx_ref = f"SW-TX-{random.randint(100000, 999999)}"
            conn.execute('''
                INSERT INTO transactions (tx_ref, sender_phone, recipient_phone, amount, fee, category, title, note, status, channel)
                VALUES (?, ?, ?, ?, 0, 'transfer', ?, ?, 'COMPLETED', 'SWITCH')
            ''', (tx_ref, user['phone'], recipient, -amount, f"Transfert vers {recipient}", note))

            conn.commit()
            conn.close()

            return self._send_json({
                "success": True,
                "tx_ref": tx_ref,
                "new_balance": new_balance,
                "amount": amount,
                "recipient": recipient
            })

        # 3. Dépôt Entrant GSM (MTN, Moov, Celtiis)
        if path == '/api/transactions/deposit':
            amount = int(payload.get('amount', 0))
            channel = payload.get('channel', 'MTN_MOMO')

            if amount <= 0:
                return self._send_json({"success": False, "error": "Montant invalide"}, 400)

            conn = get_connection()
            user = conn.execute("SELECT * FROM users WHERE phone = '+229 97 12 34 56'").fetchone()
            new_balance = user['balance'] + amount
            conn.execute("UPDATE users SET balance = ? WHERE id = ?", (new_balance, user['id']))

            tx_ref = f"SW-DEP-{random.randint(100000, 999999)}"
            conn.execute('''
                INSERT INTO transactions (tx_ref, sender_phone, recipient_phone, amount, fee, category, title, note, status, channel)
                VALUES (?, ?, ?, ?, 0, 'deposit', ?, ?, 'COMPLETED', ?)
            ''', (tx_ref, channel, user['phone'], amount, f"Dépôt {channel.replace('_', ' ')}", f"Recharge 0% {channel}", channel))

            conn.commit()
            conn.close()

            return self._send_json({
                "success": True,
                "tx_ref": tx_ref,
                "new_balance": new_balance,
                "amount": amount
            })

        # 4. Retrait Exclusif Guichet Switch
        if path == '/api/transactions/withdraw':
            amount = int(payload.get('amount', 0))
            agent_code = payload.get('agent_code', 'AGT-4092')

            conn = get_connection()
            user = conn.execute("SELECT * FROM users WHERE phone = '+229 97 12 34 56'").fetchone()
            if not user or user['balance'] < amount:
                conn.close()
                return self._send_json({"success": False, "error": "Solde insuffisant"}, 400)

            # Débit utilisateur & Crédit Float Agent
            new_balance = user['balance'] - amount
            conn.execute("UPDATE users SET balance = ? WHERE id = ?", (new_balance, user['id']))
            conn.execute("UPDATE agents SET commissions_balance = commissions_balance + ? WHERE agent_code = ?", (int(amount * 0.005), agent_code))

            tx_ref = f"SW-RET-{random.randint(100000, 999999)}"
            conn.execute('''
                INSERT INTO transactions (tx_ref, sender_phone, recipient_phone, amount, fee, category, title, note, status, channel)
                VALUES (?, ?, ?, ?, 0, 'withdrawal', ?, ?, 'COMPLETED', 'AGENT_CASH')
            ''', (tx_ref, user['phone'], agent_code, -amount, f"Retrait Kiosque Switch ({agent_code})", "Espèces décaissées", "AGENT_CASH"))

            conn.commit()
            conn.close()

            return self._send_json({
                "success": True,
                "tx_ref": tx_ref,
                "new_balance": new_balance,
                "amount": amount,
                "agent_code": agent_code
            })

        # 5. Paiement Facture SBEE (Électricité)
        if path == '/api/bills/pay-sbee':
            meter = payload.get('meter', '14294820194')
            amount = int(payload.get('amount', 5000))

            conn = get_connection()
            user = conn.execute("SELECT * FROM users WHERE phone = '+229 97 12 34 56'").fetchone()
            if not user or user['balance'] < amount:
                conn.close()
                return self._send_json({"success": False, "error": "Solde insuffisant"}, 400)

            new_balance = user['balance'] - amount
            conn.execute("UPDATE users SET balance = ? WHERE id = ?", (new_balance, user['id']))

            # Génération d'un vrai code token STS 20 chiffres (4x5)
            token_sts = f"{random.randint(1000,9999)} {random.randint(1000,9999)} {random.randint(1000,9999)} {random.randint(1000,9999)} {random.randint(1000,9999)}"
            kwh = round(amount / 125.5, 2)
            tx_ref = f"SW-SBEE-{random.randint(100000, 999999)}"

            conn.execute('''
                INSERT INTO bill_orders (order_ref, user_id, biller_name, meter_number, amount, token_sts, kwh_units)
                VALUES (?, ?, 'SBEE', ?, ?, ?, ?)
            ''', (tx_ref, user['id'], meter, amount, token_sts, kwh))

            conn.execute('''
                INSERT INTO transactions (tx_ref, sender_phone, recipient_phone, amount, fee, category, title, note, status, channel)
                VALUES (?, ?, 'SBEE', ?, 0, 'utility', 'Recharge SBEE Compteur', ?, 'COMPLETED', 'SWITCH')
            ''', (tx_ref, user['phone'], -amount, f"Token: {token_sts} ({kwh} kWh)", 'SWITCH'))

            conn.commit()
            conn.close()

            return self._send_json({
                "success": True,
                "tx_ref": tx_ref,
                "token_sts": token_sts,
                "kwh_units": kwh,
                "meter": meter,
                "amount": amount,
                "new_balance": new_balance
            })

        return self._send_json({"error": "Route introuvable"}, 404)

if __name__ == '__main__':
    with http.server.ThreadingHTTPServer(('0.0.0.0', PORT), SwitchFintechHandler) as httpd:
        print(f"🚀 Serveur Switch Bénin Multi-Thread démarré sur http://localhost:{PORT}")
        print(f"📂 Répertoire racine: {DIRECTORY}")
        httpd.serve_forever()
