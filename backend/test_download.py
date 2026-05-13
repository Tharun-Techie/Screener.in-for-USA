import yfinance as yf

try:
    data = yf.download("AAPL", period="1d")
    print("Download success:", data.columns)
    print("Close price:", data['Close'].iloc[-1].item())
except Exception as e:
    print("Download Error:", e)
