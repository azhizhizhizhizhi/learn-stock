import { useState, useCallback } from 'react';
import SearchBar from './components/SearchBar';
import StockChart from './components/StockChart';
import StockInfo from './components/StockInfo';
import { getKlineData } from './api/stockApi';
import type { Stock, StockInfo as StockInfoType, StockData } from './types/stock';

function App() {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 处理股票选择 - 从API获取真实数据
  const handleSelectStock = useCallback(async (stockInfo: StockInfoType) => {
    setLoading(true);
    setError(null);
    
    try {
      // 从API获取K线数据
      const klineData: StockData[] = await getKlineData(
        stockInfo.code, 
        stockInfo.market, 
        365
      );
      
      if (klineData.length === 0) {
        throw new Error('未获取到数据');
      }
      
      // 构建完整的股票数据
      const stock: Stock = {
        info: stockInfo,
        data: klineData,
      };
      
      setSelectedStock(stock);
    } catch (err) {
      console.error('获取股票数据失败:', err);
      setError(`获取 ${stockInfo.name} 数据失败，请稍后重试`);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              📈 A股特殊图形分析
            </h1>
            <SearchBar onSelectStock={handleSelectStock} loading={loading} />
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-600">正在加载股票数据...</span>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* 股票数据展示 */}
        {selectedStock && !loading && (
          <div className="space-y-6">
            {/* 股票信息面板 */}
            <StockInfo 
              info={selectedStock.info} 
              latestData={selectedStock.data[selectedStock.data.length - 1]} 
            />
            
            {/* 压缩图 */}
            <StockChart data={selectedStock.data} />
          </div>
        )}

        {/* 空状态提示 */}
        {!selectedStock && !loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              欢迎使用A股特殊图形分析工具
            </h2>
            <p className="text-gray-500 mb-6 text-center max-w-md">
              请在上方搜索框中输入股票代码或名称，查看独特的成交量加权压缩图。
              蜡烛宽度代表成交额大小，高度代表价格区间。
            </p>
            <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
              <h3 className="font-semibold text-gray-700 mb-3">📌 快速开始</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 输入股票代码如 <span className="font-mono bg-gray-100 px-1">600519</span></p>
                <p>• 或输入股票名称如 <span className="font-mono bg-gray-100 px-1">茅台</span></p>
                <p>• 选择后即可查看特殊图形分析</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-2">🎯 热门股票</h3>
                <p className="text-xs text-gray-400 mb-2">点击下方股票代码搜索</p>
                <div className="flex flex-wrap gap-2">
                  {['600519', '000858', '601318', '000001', '600036', '000333', '002415'].map((code) => (
                    <span
                      key={code}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          <p>压缩图分析工具 · 数据来源：东方财富网 · 仅供参考</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
