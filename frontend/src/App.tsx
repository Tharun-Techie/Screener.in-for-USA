import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Download, Link as LinkIcon, Home, BarChart2, Briefcase, UserPlus, Moon, Sun, Star, Clock } from 'lucide-react';
import { createChart, ColorType, BarSeries, LineSeries, CandlestickSeries } from 'lightweight-charts';

const API_BASE_URL = 'http://localhost:8000/api';

type Timeframe = { label: string; interval: string; period: string };
const TIMEFRAMES: Timeframe[] = [
  { label: '15m', interval: '15m', period: '5d' },
  { label: '1H', interval: '1h', period: '1mo' },
  { label: '4H', interval: '4h', period: '1mo' },
  { label: '1D', interval: '1d', period: '1y' },
  { label: '1W', interval: '1wk', period: '5y' },
  { label: '1M', interval: '1mo', period: '10y' },
];

function App() {
  const [ticker, setTicker] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any>(null);
  const [peers, setPeers] = useState<any[]>([]);
  
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('screener_watchlist') || '[]'); } catch { return []; }
  });
  const [recentStocks, setRecentStocks] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('screener_recent') || '[]'); } catch { return []; }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(TIMEFRAMES[3]); // 1D

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('screener_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem('screener_recent', JSON.stringify(recentStocks));
  }, [recentStocks]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const fetchChartData = async (sym: string, tf: Timeframe) => {
    try {
      const timestamp = Date.now();
      const chartRes = await fetch(`${API_BASE_URL}/stock/${sym}/chart?interval=${tf.interval}&period=${tf.period}&t=${timestamp}`);
      if (chartRes.ok) setChartData(await chartRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStockData = async (symbol: string) => {
    if (!symbol) return;
    setLoading(true);
    setError('');
    const upperSymbol = symbol.toUpperCase();
    setTicker(upperSymbol);
    
    // Add to recently viewed
    setRecentStocks(prev => {
      const filtered = prev.filter(s => s !== upperSymbol);
      return [upperSymbol, ...filtered].slice(0, 8); // Keep last 8
    });

    try {
      const timestamp = Date.now();
      const summaryRes = await fetch(`${API_BASE_URL}/stock/${symbol}/summary?t=${timestamp}`);
      if (!summaryRes.ok) throw new Error('Stock not found or API error');
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      await fetchChartData(symbol, selectedTimeframe);

      const finRes = await fetch(`${API_BASE_URL}/stock/${symbol}/financials?t=${timestamp}`);
      if (finRes.ok) setFinancials(await finRes.json());

      const peersRes = await fetch(`${API_BASE_URL}/stock/${symbol}/peers?t=${timestamp}`);
      if (peersRes.ok) setPeers(await peersRes.json());
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      setSummary(null); // Return to home view with error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchStockData(searchInput.trim().toUpperCase());
    }
  };

  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    setTicker('');
    setSummary(null);
    setSearchInput('');
    setError('');
  };

  const formatNumber = (num: number | null | undefined, isCurrency = false) => {
    if (num === null || num === undefined) return '-';
    if (num > 1e9) return `${isCurrency ? '$' : ''}${(num / 1e9).toFixed(2)} B`;
    if (num > 1e6) return `${isCurrency ? '$' : ''}${(num / 1e6).toFixed(2)} M`;
    return `${isCurrency ? '$' : ''}${num.toFixed(2)}`;
  };

  // If there's no summary and not loading, we show the Home Page
  const isHome = !summary && !loading;

  return (
    <>
      <nav className="u-full-width top-nav-holder">
        <div className="container">
          <div className="layer-holder top-navigation">
            <div className="layer flex flex-space-between flex-align-center" style={{ height: '50px' }}>
              <div className="flex flex-align-center">
                <a href="/" onClick={goHome} className="logo-text">
                  <TrendingUp color="var(--primary-color)" /> Screener Clone
                </a>

                <div className="desktop-links" style={{ display: 'flex', alignItems: 'center' }}>
                  <a href="/" onClick={goHome}>Home</a>
                  <a href="#">Screens</a>
                  <button className="button-plain">Tools ▾</button>
                  <button className="button-plain" onClick={toggleTheme} title="Toggle Theme" style={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                  </button>
                </div>
              </div>

              {!isHome && (
                <div className="flex flex-gap-16 flex-align-center">
                  <form className="nav-search" onSubmit={handleSearch}>
                    <Search size={16} color="var(--text-muted)" />
                    <input 
                      type="text" 
                      placeholder="Search for a company" 
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </form>
                  <div className="flex flex-gap-8" style={{ margin: '4px' }}>
                    <a className="button" href="#">Login</a>
                    <a className="button button-secondary" href="#">Get free account</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow container main-content">
        {loading && (
          <div style={{ textAlign: 'center', padding: '50px' }}>Loading data...</div>
        )}

        {isHome && (
          <div className="flex flex-column" style={{ maxWidth: '650px', margin: '96px auto', minHeight: '60vh', textAlign: 'center', justifyContent: 'center', padding: '16px' }}>
            <h1 style={{ marginBottom: '0' }}>
              <a href="/" onClick={goHome} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <TrendingUp size={48} color="var(--primary-color)" />
                <span style={{ fontSize: '3rem', fontWeight: 700 }}>Screener Clone</span>
              </a>
            </h1>

            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '10px' }}>
              Stock analysis and screening tool for investors in the USA.
            </p>

            <div style={{ marginTop: '3%' }}>
              <form className="home-search" style={{ marginBottom: '1.5rem' }} onSubmit={handleSearch}>
                <i className="addon">
                  <Search size={24} />
                </i>
                <input 
                  aria-label="Search for a company" 
                  type="search" 
                  autoComplete="off" 
                  spellCheck="false" 
                  placeholder="Search for a company" 
                  autoFocus 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </form>
              
              {error && (
                 <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>
              )}

              <p className="suggestions">
                Or analyse:
                {['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'NVDA', 'META', 'NFLX', 'INTC', 'AMD'].map(sym => (
                  <a key={sym} className="button" href={`#${sym}`} onClick={(e) => { e.preventDefault(); setSearchInput(sym); fetchStockData(sym); }}>
                    {sym}
                  </a>
                ))}
              </p>
            </div>
          </div>
        )}

        {!isHome && summary && (
          <>
            <div>
              <h1 className="company-title">{summary.name}</h1>
              <div className="company-links">
                {summary.website && (
                  <a href={summary.website} target="_blank" rel="noreferrer">
                    <LinkIcon size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }}/> 
                    {summary.website}
                  </a>
                )}
                <span>Sector: {summary.sector}</span>
              </div>
            </div>

            <div className="card">
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Market Cap</span>
                  <span className="summary-value">{formatNumber(summary.marketCap, true)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Current Price</span>
                  <span className="summary-value">${summary.currentPrice?.toFixed(2) || '-'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">High / Low</span>
                  <span className="summary-value">${summary.high52Week?.toFixed(2)} / ${summary.low52Week?.toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Stock P/E</span>
                  <span className="summary-value">{summary.peRatio?.toFixed(2) || '-'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Book Value</span>
                  <span className="summary-value">${summary.bookValue?.toFixed(2) || '-'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Dividend Yield</span>
                  <span className="summary-value">
                    {summary.dividendYield ? (summary.dividendYield * 100).toFixed(2) + '%' : '-'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">ROCE</span>
                  <span className="summary-value">
                    {summary.roce ? (summary.roce * 100).toFixed(2) + '%' : '-'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">ROE</span>
                  <span className="summary-value">
                    {summary.roe ? (summary.roe * 100).toFixed(2) + '%' : '-'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Face Value</span>
                  <span className="summary-value">${summary.faceValue?.toFixed(2) || '-'}</span>
                </div>
              </div>
            </div>
            {/* Chart section */}
            <div className="card">
              <div className="flex-space-between flex-align-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h2 className="card-title" style={{ borderBottom: 'none', margin: 0, paddingBottom: 0 }}>Chart</h2>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {TIMEFRAMES.map(tf => (
                    <button
                      key={tf.label}
                      className={`button ${selectedTimeframe.label === tf.label ? 'button-primary' : 'button-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={() => {
                        setSelectedTimeframe(tf);
                        fetchChartData(ticker, tf);
                      }}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ width: '100%' }}>
                {chartData.length > 0 ? (
                  <LightweightChart data={chartData} theme={theme} />
                ) : (
                  <div>No chart data available</div>
                )}
              </div>
            </div>

            {peers && peers.length > 0 && (
              <div className="card">
                <h2 className="card-title">Peer Comparison</h2>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>S.No.</th>
                        <th>Name</th>
                        <th>CMP $</th>
                        <th>P/E</th>
                        <th>Mar Cap $</th>
                      </tr>
                    </thead>
                    <tbody>
                      {peers.map((peer, idx) => (
                        <tr key={peer.symbol}>
                          <td>{idx + 1}</td>
                          <td style={{ color: 'var(--primary-color)', cursor: 'pointer' }} onClick={() => fetchStockData(peer.symbol)}>
                            {peer.name || peer.symbol}
                          </td>
                          <td>{peer.price?.toFixed(2) || '-'}</td>
                          <td>{peer.peRatio?.toFixed(2) || '-'}</td>
                          <td>{formatNumber(peer.marketCap)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {financials?.incomeStatement && Object.keys(financials.incomeStatement).length > 0 && (
              <div className="card">
                <h2 className="card-title">Profit & Loss</h2>
                <div className="table-container">
                  <FinancialTable data={financials.incomeStatement} />
                </div>
              </div>
            )}

          </>
        )}
      </main>

      <footer>
        <div className="container footer-content">
          <div className="footer-logo-section">
            <a href="/" onClick={goHome} className="logo-text" style={{ marginBottom: '16px' }}>
              <TrendingUp color="var(--primary-color)" /> Screener Clone
            </a>
            <p style={{ fontWeight: 500 }}>Stock analysis and screening tool</p>
            <p className="sub">USA clone © 2026</p>
            <p className="sub" style={{ fontSize: '13px' }}>Data provided by Yahoo Finance</p>
          </div>
          <div className="footer-links-section">
            <div>
              <div className="title">Product</div>
              <ul>
                <li><a href="#">Premium</a></li>
                <li><a href="#">What's new?</a></li>
                <li><a href="#">Learn</a></li>
              </ul>
            </div>
            <div>
              <div className="title">Team</div>
              <ul>
                <li><a href="#">About us</a></li>
                <li><a href="#">Support</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

// Helper to render complex dicts as tables
function FinancialTable({ data }: { data: any }) {
  const rows = Object.keys(data);
  if (rows.length === 0) return null;
  
  const allDates = new Set<string>();
  rows.forEach(row => {
    Object.keys(data[row]).forEach(d => allDates.add(d));
  });
  
  const columns = Array.from(allDates).sort((a, b) => b.localeCompare(a));

  return (
    <table>
      <thead>
        <tr>
          <th>Particulars</th>
          {columns.map(c => <th key={c}>{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 15).map(row => (
          <tr key={row}>
            <td>{row}</td>
            {columns.map(c => {
              const val = data[row][c];
              let formatted = '-';
              if (val !== undefined && val !== null && val !== 0) {
                 if (Math.abs(val) > 1e6) {
                   formatted = (val / 1e6).toFixed(0);
                 } else {
                   formatted = val.toFixed(0);
                 }
              }
              return <td key={c}>{formatted}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Lightweight Charts Component
function LightweightChart({ data, theme }: { data: any[], theme: 'light' | 'dark' }) {
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = React.useState<'line' | 'bar' | 'candlestick'>('line');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: theme === 'dark' ? '#e5e7eb' : '#333',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: theme === 'dark' ? '#333333' : '#e0e0e0' },
        horzLines: { color: theme === 'dark' ? '#333333' : '#e0e0e0' },
      },
      timeScale: {
        borderColor: theme === 'dark' ? '#444' : '#cccccc',
      },
      rightPriceScale: {
        borderColor: theme === 'dark' ? '#444' : '#cccccc',
      },
    });

    let series: any;
    if (chartType === 'bar') {
      series = chart.addSeries(BarSeries, { upColor: '#26a69a', downColor: '#ef5350' });
    } else if (chartType === 'candlestick') {
      series = chart.addSeries(CandlestickSeries, { 
        upColor: '#26a69a', 
        downColor: '#ef5350', 
        borderVisible: false, 
        wickUpColor: '#26a69a', 
        wickDownColor: '#ef5350' 
      });
    } else {
      series = chart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 2 });
    }

    // Ensure data is sorted by time and formatted correctly
    // Added fallback to d.date and d.price in case the old API response is cached
    const formattedData = data.map(d => {
      const t = d.time || d.date;
      if (chartType === 'line') {
        return { time: t, value: d.close !== undefined ? d.close : d.price };
      }
      return {
        time: t,
        open: d.open !== undefined ? d.open : d.price,
        high: d.high !== undefined ? d.high : d.price,
        low: d.low !== undefined ? d.low : d.price,
        close: d.close !== undefined ? d.close : d.price,
      };
    }).sort((a, b) => {
      const aTime = typeof a.time === 'number' ? a.time : new Date(a.time as string).getTime();
      const bTime = typeof b.time === 'number' ? b.time : new Date(b.time as string).getTime();
      return aTime - bTime;
    });

    series.setData(formattedData);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, chartType]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'flex-end' }}>
        <button 
          className={`button ${chartType === 'line' ? '' : 'button-secondary'}`} 
          style={{ padding: '4px 12px', minWidth: 'auto', height: 'auto', lineHeight: 'normal' }} 
          onClick={() => setChartType('line')}
        >Line</button>
        <button 
          className={`button ${chartType === 'candlestick' ? '' : 'button-secondary'}`} 
          style={{ padding: '4px 12px', minWidth: 'auto', height: 'auto', lineHeight: 'normal' }} 
          onClick={() => setChartType('candlestick')}
        >Candles</button>
        <button 
          className={`button ${chartType === 'bar' ? '' : 'button-secondary'}`} 
          style={{ padding: '4px 12px', minWidth: 'auto', height: 'auto', lineHeight: 'normal' }} 
          onClick={() => setChartType('bar')}
        >Bars</button>
      </div>
      <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />
    </div>
  );
}

export default App;
