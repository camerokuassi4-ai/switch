"""
backend/db.py — Base de Données SQLite Réelle & Grand Livre Comptable Switch Bénin 🇧🇯
"""

import sqlite3
import os
import json
import hashlib
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'switch_benin.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_pin(pin: str) -> str:
    return hashlib.sha256(f"SWITCH_SALT_{pin}".encode('utf-8')).hexdigest()

def init_database():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_connection()
    c = conn.cursor()

    # 1. Table Utilisateurs (Grand Public, Marchands, Agents)
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT,
            pin_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user', -- 'user', 'merchant', 'agent'
            kyc_level INTEGER DEFAULT 2, -- 1, 2, 3
            npi_anip TEXT,
            rib_uemoa TEXT UNIQUE,
            balance INTEGER DEFAULT 110000,
            vault_balance INTEGER DEFAULT 45000,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 2. Table Agents Agréés (Kiosques, Relais, Mixte)
    c.execute('''
        CREATE TABLE IF NOT EXISTS agents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            agent_code TEXT UNIQUE NOT NULL,
            business_name TEXT NOT NULL,
            model_type TEXT DEFAULT 'pure_agent', -- 'pure_agent', 'hybrid_merchant', 'mobile_agent'
            product_category TEXT,
            city TEXT NOT NULL,
            neighborhood TEXT NOT NULL,
            gps_lat REAL,
            gps_lng REAL,
            float_balance INTEGER DEFAULT 1475000,
            shop_balance INTEGER DEFAULT 385000,
            commissions_balance INTEGER DEFAULT 48500,
            is_open INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # 3. Table Marchands & Entreprises
    c.execute('''
        CREATE TABLE IF NOT EXISTS merchants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            merchant_code TEXT UNIQUE NOT NULL,
            business_name TEXT NOT NULL,
            ifu_number TEXT,
            category TEXT,
            shop_balance INTEGER DEFAULT 385000,
            qr_payload TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # 4. Table Transactions & Grand Livre Comptable (Ledger)
    c.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tx_ref TEXT UNIQUE NOT NULL,
            sender_phone TEXT,
            recipient_phone TEXT,
            amount INTEGER NOT NULL,
            fee INTEGER DEFAULT 0,
            category TEXT NOT NULL, -- 'transfer', 'deposit', 'withdrawal', 'utility', 'vault', 'campus', 'invest'
            title TEXT NOT NULL,
            note TEXT,
            status TEXT DEFAULT 'COMPLETED', -- 'PENDING', 'COMPLETED', 'FAILED'
            channel TEXT DEFAULT 'SWITCH', -- 'SWITCH', 'MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH', 'AGENT_CASH'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 5. Table Facturiers & Recharges SBEE / SONEB / Campus
    c.execute('''
        CREATE TABLE IF NOT EXISTS bill_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_ref TEXT UNIQUE NOT NULL,
            user_id INTEGER,
            biller_name TEXT NOT NULL, -- 'SBEE', 'SONEB', 'CAMPUS_UAC', 'CANAL_PLUS'
            meter_number TEXT NOT NULL,
            amount INTEGER NOT NULL,
            token_sts TEXT,
            kwh_units REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 6. Table Points de Service (Carte GPS des 500+ Agents au Bénin)
    c.execute('''
        CREATE TABLE IF NOT EXISTS cashpoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            agent_code TEXT NOT NULL,
            city TEXT NOT NULL,
            neighborhood TEXT NOT NULL,
            phone TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            cash_available INTEGER DEFAULT 1,
            is_open INTEGER DEFAULT 1
        )
    ''')

    conn.commit()

    # Peuple les données de démonstration si vide
    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] == 0:
        seed_data(conn)

    conn.close()
    print("✅ Base de données Switch Bénin initialisée avec succès.")

def seed_data(conn):
    c = conn.cursor()
    
    # 1. Compte de base Adele Doe
    pin_hash = hash_pin("1234")
    c.execute('''
        INSERT INTO users (phone, full_name, email, pin_hash, role, kyc_level, npi_anip, rib_uemoa, balance, vault_balance)
        VALUES ('+229 97 12 34 56', 'Adele Doe', 'adele.doe@gmail.com', ?, 'user', 2, '1996 0814 1234 56', 'BJ061 01001 09876543210 44', 110000, 45000)
    ''', (pin_hash,))
    user_id = c.lastrowid

    # 2. Agent Mixte (Kiosque & Boutique Saint-Michel)
    c.execute('''
        INSERT INTO agents (user_id, agent_code, business_name, model_type, product_category, city, neighborhood, gps_lat, gps_lng, float_balance, shop_balance, commissions_balance)
        VALUES (?, 'AGT-4092', 'Kiosque & Boutique Saint-Michel', 'hybrid_merchant', 'Alimentation générale', 'Cotonou', 'Saint-Michel (Près du Carrefour)', 6.3683, 2.4289, 1475000, 385000, 48500)
    ''', (user_id,))

    # 3. Marchand Pro
    c.execute('''
        INSERT INTO merchants (user_id, merchant_code, business_name, ifu_number, category, shop_balance, qr_payload)
        VALUES (?, 'MCH-8821', 'Boutique Élite Cotonou', '3201948271049', 'Prêt-à-porter', 385000, 'SWITCH:PAY:MCH-8821')
    ''', (user_id,))

    # 4. Transactions initiales de test
    initial_txs = [
        ("SW-8921", "+229 97 12 34 56", "+229 96 88 44 22", -5000, 0, "transfer", "Transfert à Maman (Awa GBEGNON)", "Argent de popote", "COMPLETED", "SWITCH"),
        ("SW-9022", "+229 97 12 34 56", "SBEE", -10000, 0, "utility", "Recharge SBEE Compteur Électrique", "Compteur #14294820194", "COMPLETED", "SWITCH"),
        ("SW-9143", "+229 97 12 34 56", "LYCEE", -15000, 0, "campus", "Scolarité LYCEE (2024-STU-55201)", "Frais d'examen", "COMPLETED", "SWITCH"),
        ("SW-9284", "MTN_MOMO", "+229 97 12 34 56", 50000, 0, "deposit", "Dépôt entrant MTN Mobile Money", "Dépôt via *133#", "COMPLETED", "MTN_MOMO"),
        ("SW-9355", "+229 97 12 34 56", "SWITCH_VAULT", -20000, 0, "vault", "Dépôt Coffre Épargne Vault 6%", "Épargne sécurisée", "COMPLETED", "SWITCH"),
        ("SW-9416", "+229 97 12 34 56", "MTN_DATA", -2000, 0, "telecom", "Recharge Forfait MTN Data 5 Go", "Forfait internet", "COMPLETED", "SWITCH"),
    ]
    for tx in initial_txs:
        c.execute('''
            INSERT INTO transactions (tx_ref, sender_phone, recipient_phone, amount, fee, category, title, note, status, channel)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', tx)

    # 5. Points relais GPS de proximité au Bénin
    cashpoints = [
        ("Kiosque Switch Saint-Michel", "AGT-4092", "Cotonou", "Saint-Michel (Carrefour)", "+229 97 12 34 56", 6.3683, 2.4289),
        ("Agence Relais Switch Akpakpa", "AGT-1021", "Cotonou", "Akpakpa Dodomè", "+229 96 11 22 33", 6.3650, 2.4450),
        ("Point Service Switch Calavi Arconville", "AGT-5541", "Abomey-Calavi", "Arconville (Face Pharmacie)", "+229 95 44 55 66", 6.4485, 2.3556),
        ("Kiosque Switch Étoile Rouge", "AGT-3312", "Cotonou", "Étoile Rouge (Station Bénin Pétro)", "+229 94 77 88 99", 6.3755, 2.4110),
        ("Agence Relais Porto-Novo Ouando", "AGT-7709", "Porto-Novo", "Marché Ouando", "+229 97 00 11 22", 6.5050, 2.6100),
        ("Guichet Switch Parakou Albarika", "AGT-8820", "Parakou", "Albarika Université", "+229 96 33 44 55", 9.3370, 2.6300),
    ]
    for cp in cashpoints:
        c.execute('''
            INSERT INTO cashpoints (name, agent_code, city, neighborhood, phone, lat, lng)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', cp)

    conn.commit()

if __name__ == '__main__':
    init_database()
