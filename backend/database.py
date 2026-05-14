import sqlite3
import json
import time
import os

DB_FILE = os.path.join(os.path.dirname(__file__), "stock_cache.db")
CACHE_EXPIRY = 86400  # 24 hours in seconds

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS cache (
            key TEXT PRIMARY KEY,
            data TEXT,
            timestamp REAL
        )
    ''')
    conn.commit()
    conn.close()

def get_cached(key):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('SELECT data, timestamp FROM cache WHERE key = ?', (key,))
        row = c.fetchone()
        conn.close()
        
        if row:
            data_str, timestamp = row
            if time.time() - timestamp < CACHE_EXPIRY:
                return json.loads(data_str)
    except Exception as e:
        print(f"Cache read error: {e}")
    return None

def set_cache(key, data):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('''
            INSERT OR REPLACE INTO cache (key, data, timestamp)
            VALUES (?, ?, ?)
        ''', (key, json.dumps(data), time.time()))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Cache write error: {e}")
