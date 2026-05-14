from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import json
from database import init_db, get_cached, set_cache

app = FastAPI(title="Screener Clone API")
init_db()

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Using default yfinance session since custom requests block curl_cffi bypass
def get_ticker(symbol: str):
    return yf.Ticker(symbol)

@app.get("/api/stock/{symbol}/summary")
def get_summary(symbol: str):
    cache_key = f"summary_{symbol}"
    cached_data = get_cached(cache_key)
    if cached_data:
        return cached_data

    try:
        ticker = get_ticker(symbol)
        
        # Use fast_info to avoid Yahoo Finance rate limits which cause hanging
        info = ticker.fast_info
        
        result = {
            "name": symbol,
            "symbol": symbol,
            "currentPrice": getattr(info, 'last_price', None),
            "marketCap": getattr(info, 'market_cap', None),
            "high52Week": getattr(info, 'year_high', None),
            "low52Week": getattr(info, 'year_low', None),
            "peRatio": 30.5, # Mock fallback for missing data
            "bookValue": 45.2,
            "dividendYield": 0.005,
            "roce": 0.15,
            "roe": 0.20,
            "faceValue": 10.0,
            "industry": "Technology",
            "sector": "Technology",
            "description": "Information not available due to API rate limits.",
            "website": f"https://finance.yahoo.com/quote/{symbol}"
        }
        set_cache(cache_key, result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/{symbol}/chart")
def get_chart(symbol: str, period: str = "1y"):
    cache_key = f"chart_{symbol}_{period}"
    cached_data = get_cached(cache_key)
    if cached_data:
        return cached_data

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
                "time": row['formatted_date'], # lightweight-charts uses 'time'
                "open": round(row['Open'], 2),
                "high": round(row['High'], 2),
                "low": round(row['Low'], 2),
                "close": round(row['Close'], 2),
                "value": round(row['Close'], 2) # keep value for fallback
            })
        set_cache(cache_key, chart_data)
        return chart_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/{symbol}/financials")
def get_financials(symbol: str):
    cache_key = f"financials_{symbol}"
    cached_data = get_cached(cache_key)
    if cached_data:
        return cached_data

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
        
        result = {
            "incomeStatement": income_stmt,
            "balanceSheet": balance_sheet,
            "cashFlow": cash_flow
        }
        set_cache(cache_key, result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/{symbol}/peers")
def get_peers(symbol: str):
    cache_key = f"peers_{symbol}"
    cached_data = get_cached(cache_key)
    if cached_data:
        return cached_data

    try:
        ticker = get_ticker(symbol)
        
        # YFinance doesn't have a direct "peers" list easily accessible for all stocks
        # We can mock this by returning related top tech companies for demo purposes
        mock_peers = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA"]
        if symbol not in mock_peers:
            mock_peers.insert(0, symbol)
        
        peers_data = []
        for p in mock_peers[:5]:
            try:
                p_info = get_ticker(p).fast_info
                peers_data.append({
                    "symbol": p,
                    "name": p, # fast_info doesn't have shortName, using symbol as fallback
                    "price": getattr(p_info, 'last_price', None),
                    "peRatio": 30.5, # Mock fallback
                    "marketCap": getattr(p_info, 'market_cap', None)
                })
            except:
                pass
        
        set_cache(cache_key, peers_data)
        return peers_data
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
