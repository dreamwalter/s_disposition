import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StockTable.css';

const StockTable = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // 排序狀態
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc' // 'asc' 或 'desc'
  });

  const API_BASE_URL = 'http://localhost:8888';

  const fetchStocks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/disposition`);
      
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

  // 排序功能
  const handleSort = (key) => {
    let direction = 'asc';
    
    // 如果點擊同一欄位，切換排序方向
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // 排序數據
  const sortedStocks = React.useMemo(() => {
    if (!sortConfig.key) return stocks;

    return [...stocks].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // 處理 null 或 undefined 值
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // 數字排序
      if (sortConfig.key === 'symbol') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      // 日期排序
      if (sortConfig.key.includes('date') || sortConfig.key === 'start' || sortConfig.key === 'end') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // 字符串排序（不區分大小寫）
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [stocks, sortConfig]);

  // 分頁邏輯
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStocks = sortedStocks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedStocks.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 格式化日期顯示
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  // 渲染排序圖標
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <span className="sort-icon">↕️</span>;
    }
    
    return sortConfig.direction === 'asc' 
      ? <span className="sort-icon">⬆️</span>
      : <span className="sort-icon">⬇️</span>;
  };

  // 渲染分頁控件
  const renderPagination = () => {
    const pageNumbers = [];
    const maxPageButtons = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination">
        <button 
          onClick={goToPreviousPage} 
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          上一頁
        </button>

        {startPage > 1 && (
          <>
            <button 
              onClick={() => paginate(1)}
              className="pagination-btn"
            >
              1
            </button>
            {startPage > 2 && <span className="pagination-ellipsis">...</span>}
          </>
        )}

        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => paginate(number)}
            className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
          >
            {number}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
            <button 
              onClick={() => paginate(totalPages)}
              className="pagination-btn"
            >
              {totalPages}
            </button>
          </>
        )}

        <button 
          onClick={goToNextPage} 
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          下一頁
        </button>
      </div>
    );
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
          <span>共 {sortedStocks.length} 筆記錄</span>
          {sortConfig.key && (
            <span className="sort-info">
              排序: {getColumnName(sortConfig.key)} ({sortConfig.direction === 'asc' ? '升序' : '降序'})
            </span>
          )}
          <button onClick={fetchStocks} className="refresh-btn">
            🔄 刷新
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="stock-table">
          <thead>
            <tr>
              <th 
                className="sortable" 
                onClick={() => handleSort('symbol')}
              >
                股票代號 {renderSortIcon('symbol')}
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('name')}
              >
                股票名稱 {renderSortIcon('name')}
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('stock_date')}
              >
                資料日期 {renderSortIcon('stock_date')}
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('market')}
              >
                市場 {renderSortIcon('market')}
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('start')}
              >
                處置開始 {renderSortIcon('start')}
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('end')}
              >
                處置結束 {renderSortIcon('end')}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentStocks.length > 0 ? (
              currentStocks.map((stock, index) => (
                <tr key={`${stock.symbol}-${stock.stock_date}-${index}`}>
                  <td className="symbol">{stock.symbol}</td>
                  <td className="name">{stock.name}</td>
                  <td className="date">{formatDate(stock.stock_date)}</td>
                  <td>
                    <span className={`market ${stock.market.toLowerCase()}`}>
                      {stock.market}
                    </span>
                  </td>
                  <td className="date">{formatDate(stock.start)}</td>
                  <td className="date">{formatDate(stock.end)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  沒有找到任何數據
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {sortedStocks.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            顯示第 {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, sortedStocks.length)} 筆，
            共 {sortedStocks.length} 筆記錄
            {sortConfig.key && (
              <span className="sort-info-mobile">
                • 排序: {getColumnName(sortConfig.key)} ({sortConfig.direction === 'asc' ? '升序' : '降序'})
              </span>
            )}
          </div>
          {renderPagination()}
        </div>
      )}
    </div>
  );
};

// 輔助函數：獲取欄位顯示名稱
const getColumnName = (key) => {
  const columnNames = {
    symbol: '股票代號',
    name: '股票名稱',
    market: '市場',
    start: '處置開始',
    end: '處置結束',
    stock_date: '資料日期',
    created_at: '建立時間'
  };
  return columnNames[key] || key;
};

export default StockTable;