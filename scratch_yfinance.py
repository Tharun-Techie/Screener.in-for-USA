import yfinance as yf
import json

def get_stock_data(ticker_symbol):
    ticker = yf.Ticker(ticker_symbol)
    
    info = ticker.info
    print("Keys in info:", list(info.keys())[:20])
    print("Market Cap:", info.get("marketCap"))
    print("PE:", info.get("trailingPE"))
    print("Dividend Yield:", info.get("dividendYield"))
    print("ROCE:", info.get("returnOnEquity")) # ROCE might not be directly available, ROE is.
    
    print("\nFinancials:")
    print(ticker.financials)
    
    print("\nBalance Sheet:")
    print(ticker.balance_sheet)

if __name__ == "__main__":
    get_stock_data("AAPL")
