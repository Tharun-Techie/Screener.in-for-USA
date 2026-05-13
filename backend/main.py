from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import requests_cache
import pandas as pd
import json

app = FastAPI(title="Screener Clone API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up requests_cache to avoid hitting Yahoo Finance limits too quickly
session = requests_cache.CachedSession('yfinance.cache')
session.headers['User-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

def get_ticker(symbol: str):
    return yf.Ticker(symbol, session=session)

@app.get("/api/stock/{symbol}/summary")
def get_summary(symbol: str):
    try:
        ticker = get_ticker(symbol)
        info = ticker.info
        if not info or "regularMarketPrice" not in info and "currentPrice" not in info:
             # fallback for some errors
             pass

        return {
            "name": info.get("longName", info.get("shortName", symbol)),
            "symbol": symbol,
            "currentPrice": info.get("currentPrice", info.get("regularMarketPrice")),
            "marketCap": info.get("marketCap"),
            "high52Week": info.get("fiftyTwoWeekHigh"),
            "low52Week": info.get("fiftyTwoWeekLow"),
            "peRatio": info.get("trailingPE"),
            "bookValue": info.get("bookValue"),
            "dividendYield": info.get("dividendYield"),
            "roce": info.get("returnOnEquity"), # ROCE is complex, using ROE as proxy or leaving null
            "roe": info.get("returnOnEquity"),
            "faceValue": 10.0, # Placeholder as US stocks usually don't emphasize FV
            "industry": info.get("industry"),
            "sector": info.get("sector"),
            "description": info.get("longBusinessSummary"),
            "website": info.get("website")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/{symbol}/chart")
def get_chart(symbol: str, period: str = "1y"):
    try:
        ticker = get_ticker(symbol)
        hist = ticker.history(period=period)
        if hist.empty:
            return []
        
        # Format for Recharts: [{date: 'YYYY-MM-DD', price: 150.0}]
        hist = hist.reset_index()
        # Ensure Date column exists
        if 'Date' in hist.columns:
            date_col = 'Date'
        elif 'Datetime' in hist.columns:
            date_col = 'Datetime'
        else:
            return []

        hist['formatted_date'] = hist[date_col].dt.strftime('%Y-%m-%d')
        chart_data = []
        for _, row in hist.iterrows():
            chart_data.append({
                "date": row['formatted_date'],
                "price": round(row['Close'], 2)
            })
        return chart_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/{symbol}/financials")
def get_financials(symbol: str):
    try:
        ticker = get_ticker(symbol)
        
        def safe_to_dict(df):
            if df is None or df.empty:
                return {}
            # Fill NaN with 0 or None
            df = df.fillna(0)
            # convert column timestamps to strings
            df.columns = [col.strftime('%Y-%m') if isinstance(col, pd.Timestamp) else str(col) for col in df.columns]
            return df.to_dict()

        # Yearly financials
        income_stmt = safe_to_dict(ticker.financials)
        balance_sheet = safe_to_dict(ticker.balance_sheet)
        cash_flow = safe_to_dict(ticker.cashflow)
        
        return {
            "incomeStatement": income_stmt,
            "balanceSheet": balance_sheet,
            "cashFlow": cash_flow
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/{symbol}/peers")
def get_peers(symbol: str):
    try:
        ticker = get_ticker(symbol)
        info = ticker.info
        sector = info.get('sector')
        
        # YFinance doesn't have a direct "peers" list easily accessible for all stocks
        # We can mock this by returning related top tech companies for demo purposes
        # Or if we have a way to fetch by sector...
        # For this clone, we will return a static list if it's a known stock, or empty.
        mock_peers = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA"]
        if symbol not in mock_peers:
            mock_peers.insert(0, symbol)
        
        peers_data = []
        for p in mock_peers[:5]:
            try:
                p_info = get_ticker(p).info
                peers_data.append({
                    "symbol": p,
                    "name": p_info.get("shortName", p),
                    "price": p_info.get("currentPrice"),
                    "peRatio": p_info.get("trailingPE"),
                    "marketCap": p_info.get("marketCap")
                })
            except:
                pass
        return peers_data
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
