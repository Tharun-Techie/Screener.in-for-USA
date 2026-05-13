import yfinance as yf

ticker = yf.Ticker("AAPL")
try:
    info = ticker.fast_info
    print("Market Cap:", info.get("marketCap", "N/A"))
    print("Price:", info.last_price)
    print("Year High:", info.year_high)
except Exception as e:
    print("Error:", e)
