import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Download, Link as LinkIcon } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const API_BASE_URL = 'http://localhost:8000/api';

function App() {
  const [ticker, setTicker] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('');
  
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any>(null);
  const [peers, setPeers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStockData = async (symbol: string) => {
    setLoading(true);
    setError('');
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
      
      setTicker(symbol.toUpperCase());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData('AAPL');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchStockData(searchInput.trim().toUpperCase());
    }
  };

  const formatNumber = (num: number | null | undefined, isCurrency = false) => {
    if (num === null || num === undefined) return '-';
    if (num > 1e9) return `${isCurrency ? '$' : ''}${(num / 1e9).toFixed(2)} B`;
    if (num > 1e6) return `${isCurrency ? '$' : ''}${(num / 1e6).toFixed(2)} M`;
    return `${isCurrency ? '$' : ''}${num.toFixed(2)}`;
  };

  return (
    <>
      <header className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" className="logo">
            <TrendingUp color="var(--primary-color)" /> Screener Clone
          </a>
          
          <form className="search-bar" onSubmit={handleSearch}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search for a company (e.g., AAPL, TSLA)" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
          
          <div style={{ fontSize: '14px' }}>
            <a href="#" style={{ margin: '0 10px', textDecoration: 'none', color: 'var(--text-main)' }}>Screens</a>
            <a href="#" style={{ margin: '0 10px', textDecoration: 'none', color: 'var(--text-main)' }}>Tools</a>
          </div>
        </div>
      </header>

      <main className="container main-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>Loading data...</div>
        ) : error ? (
          <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>{error}</div>
        ) : summary ? (
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
              <div style={{ height: '300px', width: '100%' }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" minTickGap={30} tick={{fontSize: 12}} />
                      <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} orientation="right"/>
                      <Tooltip />
                      <Line type="monotone" dataKey="price" stroke="var(--primary-color)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
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
                        <th>CMP Rs.</th>
                        <th>P/E</th>
                        <th>Mar Cap Rs.Cr.</th>
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
        ) : null}
      </main>

      <footer className="footer">
        <p>Data provided by Yahoo Finance. Not for commercial use.</p>
      </footer>
    </>
  );
}

// Helper to render complex dicts as tables
function FinancialTable({ data }: { data: any }) {
  // data is { "Total Revenue": { "2023-12-31": 1000, "2022-12-31": 800 }, ... }
  const rows = Object.keys(data);
  if (rows.length === 0) return null;
  
  // Extract columns (dates)
  const allDates = new Set<string>();
  rows.forEach(row => {
    Object.keys(data[row]).forEach(d => allDates.add(d));
  });
  
  // Sort dates descending
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
              // Format large numbers simply
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

export default App;
