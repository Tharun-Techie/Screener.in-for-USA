# Screener.in for USA 🇺🇸📈

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python)

**Screener.in for USA** is a high-fidelity, highly performant web application built to replicate the professional financial dashboard experience of the popular Indian stock analysis website, [Screener.in](https://www.screener.in/), but specifically adapted for the **US Stock Market**. 

Built with a lightning-fast FastAPI backend and a sleek React frontend, it serves comprehensive financial data, beautiful interactive charts, and real-time market insights.

---

## ✨ Features

- **Dynamic Stock Search**: Instantly look up any US publicly traded company (e.g., AAPL, MSFT, TSLA).
- **Interactive Financial Charts**: Powered by TradingView's **Lightweight Charts™**, seamlessly toggle between Line, Bar, and Candlestick (OHLC) charts.
- **Comprehensive Financial Summaries**: View critical company metrics including Market Cap, P/E Ratio, ROCE, ROE, Dividend Yield, and Book Value at a glance.
- **Detailed Financial Statements**: Dive deep into historical Income Statements, Balance Sheets, and Cash Flow metrics.
- **Peer Comparison**: Compare selected companies against top tech and industry peers.
- **Dark / Light Mode**: A fully integrated, responsive theme engine that applies gorgeous aesthetics across the entire UI and charts.

## 🛠️ Tech Stack

### Frontend
- **React 19** (via Vite)
- **TypeScript**
- **Lightweight Charts™** (by TradingView) for blazing-fast financial plotting
- **Lucide React** for crisp vector iconography
- Vanilla CSS with CSS Variables for dynamic Dark/Light theming

### Backend
- **FastAPI** for high-performance API routing
- **yfinance** for real-time and historical US stock market data
- **Pandas** for robust data processing and serialization
- **Uvicorn** as the ASGI server

---

## 🚀 Getting Started

Follow these instructions to run the project locally.

### Prerequisites
- Node.js (v18 or higher)
- Python (3.9 or higher)

### 1. Backend Setup

Open a terminal and navigate to the `backend` folder:

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server with hot-reloading
uvicorn main:app --reload
```
*The backend API will run on `http://localhost:8000`.*

### 2. Frontend Setup

Open a **new** terminal and navigate to the `frontend` folder:

```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
*The frontend will run on `http://localhost:5173`.*

---

## 📂 Project Structure

```
.
├── backend/                  # FastAPI Application
│   ├── main.py               # API endpoints & data fetching logic
│   └── requirements.txt      # Python dependencies
│
└── frontend/                 # React Application (Vite)
    ├── src/
    │   ├── App.tsx           # Main Dashboard & UI Layout
    │   ├── index.css         # Theming, Variables, and CSS Styles
    │   └── main.tsx          # React Entry Point
    ├── package.json          # Node dependencies
    └── vite.config.ts        # Vite configuration
```

## 📝 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

*Disclaimer: This is a clone project built for educational and portfolio purposes. Data is provided by Yahoo Finance and should not be used for actual trading advice.*
