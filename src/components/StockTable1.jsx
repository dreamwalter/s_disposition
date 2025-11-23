import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StockTable.css';

const StockTable = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // 這裡使用你的 Rust API 地址
  const API_BASE_URL = 'http://localhost:8888';

  const fetchStocks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 根據你的 API 端點調整
      const response = await axios.get(`${API_BASE_URL}/dispositions`);
      console.log(response)
      
      if (response.data.success) {
        setStocks(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('獲取數據失敗: ' + (err.response?.data?.message || err.message));
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  // 分頁邏輯
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStocks = stocks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(stocks.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>載入股票數據中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h3>⚠️ 數據載入失敗</h3>
        <p>{error}</p>
        <button onClick={fetchStocks} className="retry-btn">
          重新嘗試
        </button>
      </div>
    );
  }

  return (
    <div className="stock-table-container">
      <div className="table-header">
        <h2>股票處置記錄</h2>
        <div className="table-controls">
          <span>共 {stocks.length} 筆記錄</span>
          <button onClick={fetchStocks} className="refresh-btn">
            🔄 刷新
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="stock-table">
          <thead>
            <tr>
              <th>股票代號</th>
              <th>股票名稱</th>
              <th>市場</th>
              <th>處置開始</th>
              <th>處置結束</th>
              <th>資料日期</th>
            </tr>
          </thead>
          <tbody>
            {currentStocks.map((stock, index) => (
              <tr key={index}>
                <td className="symbol">{stock.symbol}</td>
                <td className="name">{stock.name}</td>
                <td>
                  <span className={`market ${stock.market.toLowerCase()}`}>
                    {stock.market}
                  </span>
                </td>
                <td>{formatDate(stock.start)}</td>
                <td>{formatDate(stock.end)}</td>
                <td>{formatDate(stock.stock_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 簡單分頁 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={currentPage === 1}
            onClick={() => paginate(currentPage - 1)}
          >
            上一頁
          </button>
          
          <span>第 {currentPage} 頁，共 {totalPages} 頁</span>
          
          <button 
            disabled={currentPage === totalPages}
            onClick={() => paginate(currentPage + 1)}
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  );
};

export default StockTable;