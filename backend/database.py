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
    c.execute('''
        CREATE TABLE IF NOT EXISTS searched_symbols (
            symbol TEXT PRIMARY KEY,
            search_count INTEGER DEFAULT 1,
            last_searched REAL
        )
    ''')
    conn.commit()
    conn.close()

def get_cached(key):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('SELECT data FROM cache WHERE key = ?', (key,))
        row = c.fetchone()
        conn.close()
        
        if row:
            data_str = row[0]
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

def log_successful_search(symbol):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('''
            INSERT INTO searched_symbols (symbol, search_count, last_searched)
            VALUES (?, 1, ?)
            ON CONFLICT(symbol) DO UPDATE SET 
                search_count = search_count + 1,
                last_searched = excluded.last_searched
        ''', (symbol.upper(), time.time()))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Log search error: {e}")

def get_symbol_suggestions(query, limit=5):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('''
            SELECT symbol FROM searched_symbols 
            WHERE symbol LIKE ? 
            ORDER BY search_count DESC, last_searched DESC 
            LIMIT ?
        ''', (f"{query.upper()}%", limit))
        rows = c.fetchall()
        conn.close()
        return [row[0] for row in rows]
    except Exception as e:
        print(f"Suggestion error: {e}")
        return []
