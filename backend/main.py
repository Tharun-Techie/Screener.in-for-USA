from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import json
from database import init_db, get_cached, set_cache, log_successful_search, get_symbol_suggestions

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
    
    live_price = None
    market_cap = None
    try:
        ticker = get_ticker(symbol)
        info = ticker.fast_info
        live_price = getattr(info, 'last_price', None)
        market_cap = getattr(info, 'market_cap', None)
    except:
        pass
        
    if cached_data:
        log_successful_search(symbol)
        if live_price:
            cached_data["currentPrice"] = live_price
            cached_data["marketCap"] = market_cap
            set_cache(cache_key, cached_data)
        return cached_data

    try:
        result = {
            "name": symbol,
            "symbol": symbol,
            "currentPrice": live_price,
            "marketCap": market_cap,
            "high52Week": getattr(info, 'year_high', None) if live_price else None,
            "low52Week": getattr(info, 'year_low', None) if live_price else None,
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
        log_successful_search(symbol)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search")
def search_symbols(q: str = ""):
    if not q:
        return []
    suggestions = get_symbol_suggestions(q)
    return suggestions

@app.get("/api/stock/{symbol}/chart")
def get_chart(symbol: str, interval: str = "1d", period: str = "1y"):
    cache_key = f"chart_{symbol}_{interval}_{period}"
    cached_data = get_cached(cache_key)

    try:
        ticker = get_ticker(symbol)
        
        hist = pd.DataFrame()
        if cached_data and len(cached_data) > 0:
            last_time = cached_data[-1]['time']
            if isinstance(last_time, int):
                import datetime
                start_date = datetime.datetime.fromtimestamp(last_time).strftime('%Y-%m-%d')
            else:
                start_date = last_time

            try:
                if interval == "4h":
                    hist = ticker.history(start=start_date, interval="1h")
                    if not hist.empty:
                        hist = hist.resample('4h').agg({
                            'Open': 'first', 'High': 'max', 'Low': 'min', 'Close': 'last'
                        }).dropna()
                else:
                    hist = ticker.history(start=start_date, interval=interval)
            except:
                hist = pd.DataFrame()
        else:
            if interval == "4h":
                hist = ticker.history(period=period, interval="1h")
                if not hist.empty:
                    hist = hist.resample('4h').agg({
                        'Open': 'first', 'High': 'max', 'Low': 'min', 'Close': 'last'
                    }).dropna()
            else:
                hist = ticker.history(period=period, interval=interval)
            
        if hist.empty and cached_data:
            return cached_data
        if hist.empty:
            return []
        
        hist = hist.reset_index()
        if 'Date' in hist.columns:
            date_col = 'Date'
        elif 'Datetime' in hist.columns:
            date_col = 'Datetime'
        else:
            return cached_data if cached_data else []

        is_intraday = interval in ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "4h"]
        
        new_data = []
        for _, row in hist.iterrows():
            if pd.isna(row['Close']):
                continue
                
            time_val = int(row[date_col].timestamp()) if is_intraday else row[date_col].strftime('%Y-%m-%d')
            
            new_data.append({
                "time": time_val,
                "open": round(row['Open'], 2),
                "high": round(row['High'], 2),
                "low": round(row['Low'], 2),
                "close": round(row['Close'], 2),
                "value": round(row['Close'], 2)
            })

        if cached_data:
            # Merge new_data into cached_data
            data_map = {item['time']: item for item in cached_data}
            for item in new_data:
                data_map[item['time']] = item
            
            merged_data = list(data_map.values())
            merged_data.sort(key=lambda x: x['time'])
            
            set_cache(cache_key, merged_data)
            return merged_data
        else:
            set_cache(cache_key, new_data)
            return new_data

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
