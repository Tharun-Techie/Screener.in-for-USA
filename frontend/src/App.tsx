import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Download, Link as LinkIcon, Home, BarChart2, Briefcase, UserPlus } from 'lucide-react';
import { createChart, ColorType, BarSeries } from 'lightweight-charts';

const API_BASE_URL = 'http://localhost:8000/api';

function App() {
  const [ticker, setTicker] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any>(null);
  const [peers, setPeers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStockData = async (symbol: string) => {
    if (!symbol) return;
    setLoading(true);
    setError('');
    setTicker(symbol.toUpperCase());
    try {
      const summaryRes = await fetch(`${API_BASE_URL}/stock/${symbol}/summary`);
      if (!summaryRes.ok) throw new Error('Stock not found or API error');
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      const chartRes = await fetch(`${API_BASE_URL}/stock/${symbol}/chart`);
      if (chartRes.ok) setChartData(await chartRes.json());

      const finRes = await fetch(`${API_BASE_URL}/stock/${symbol}/financials`);
      if (finRes.ok) setFinancials(await finRes.json());

      const peersRes = await fetch(`${API_BASE_URL}/stock/${symbol}/peers`);
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

                <div className="desktop-links">
                  <a href="/" onClick={goHome}>Home</a>
                  <a href="#">Screens</a>
                  <button className="button-plain">Tools ▾</button>
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

            <div className="card">
              <h2 className="card-title">Chart</h2>
              <div style={{ width: '100%' }}>
                {chartData.length > 0 ? (
                  <LightweightChart data={chartData} />
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
function LightweightChart({ data }: { data: any[] }) {
  const chartContainerRef = React.useRef<HTMLDivElement>(null);

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
        textColor: '#333',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#e0e0e0' },
        horzLines: { color: '#e0e0e0' },
      },
      timeScale: {
        borderColor: '#cccccc',
      },
      rightPriceScale: {
        borderColor: '#cccccc',
      },
    });

    const barSeries = chart.addSeries(BarSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
    });

    // Ensure data is sorted by time and formatted correctly
    const formattedData = data.map(d => ({
      time: d.time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    })).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    barSeries.setData(formattedData);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />;
}

export default App;
