from main import get_summary, get_chart, get_financials, get_peers
from fastapi import HTTPException

try:
    print("Testing Summary")
    print(get_summary("AAPL"))
except HTTPException as e:
    print("Summary Exception:", repr(e))

try:
    print("Testing Chart")
    print(len(get_chart("AAPL")))
except HTTPException as e:
    print("Chart Exception:", repr(e))

try:
    print("Testing Financials")
    print("Financial keys:", get_financials("AAPL").keys())
except HTTPException as e:
    print("Financials Exception:", repr(e))

try:
    print("Testing Peers")
    print("Peers count:", len(get_peers("AAPL")))
except HTTPException as e:
    print("Peers Exception:", repr(e))
