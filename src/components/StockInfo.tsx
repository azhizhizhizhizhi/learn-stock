import React from 'react';
import type { StockInfo as StockInfoType, StockData } from '../types/stock';

interface StockInfoProps {
  info: StockInfoType | null;
  latestData: StockData | null;
}

const StockInfo: React.FC<StockInfoProps> = ({ info, latestData }) => {
  if (!info || !latestData) {
    return null;
  }

  // 计算涨跌
  const change = latestData.close - latestData.open;
  const changePercent = (change / latestData.open) * 100;
  const isRising = change >= 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* 股票基本信息 */}
      <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {info.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-500">{info.code}</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
              {info.market === 'SH' ? '上海证券交易所' : '深圳证券交易所'}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              {info.industry}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${isRising ? 'text-red-500' : 'text-green-500'}`}>
            {latestData.close.toFixed(2)}
          </div>
          <div className={`text-sm ${isRising ? 'text-red-500' : 'text-green-500'}`}>
            {isRising ? '+' : ''}{change.toFixed(2)} ({isRising ? '+' : ''}{changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* 价格信息 */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">开盘价</div>
          <div className="text-lg font-semibold text-yellow-600">{latestData.open.toFixed(2)}</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">收盘价</div>
          <div className="text-lg font-semibold text-blue-600">{latestData.close.toFixed(2)}</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">最高价</div>
          <div className="text-lg font-semibold text-red-500">{latestData.high.toFixed(2)}</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">最低价</div>
          <div className="text-lg font-semibold text-green-500">{latestData.low.toFixed(2)}</div>
        </div>
      </div>

      {/* 成交信息 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-sm text-gray-500">成交额</div>
          <div className="text-lg font-semibold text-purple-600">
            {(latestData.amount / 10000).toFixed(2)} 亿
          </div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-sm text-gray-500">成交量</div>
          <div className="text-lg font-semibold text-orange-600">
            {(latestData.volume / 10000).toFixed(2)} 万手
          </div>
        </div>
        <div className="text-center p-3 bg-teal-50 rounded-lg">
          <div className="text-sm text-gray-500">换手率</div>
          <div className="text-lg font-semibold text-teal-600">
            {latestData.turnoverRate.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* 股本信息 */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
        <div className="flex justify-between">
          <span>总股本：{(info.totalShares / 10000).toFixed(2)} 亿股</span>
          <span>流通股本：{(info.floatShares / 10000).toFixed(2)} 亿股</span>
        </div>
      </div>
    </div>
  );
};

export default StockInfo;
