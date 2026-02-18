import type { Stock, StockData, StockInfo } from '../types/stock';
import { 贵州茅台Data } from './real_600519';

// 生成随机股票数据的辅助函数
function generateStockData(days: number, basePrice: number): StockData[] {
  const data: StockData[] = [];
  let currentPrice = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // 随机波动 -3% 到 +3%
    const change = (Math.random() - 0.5) * 0.06;
    const open = currentPrice;
    const close = currentPrice * (1 + change);
    
    // 最高价和最低价在开盘价和收盘价基础上波动
    const highExtra = Math.random() * 0.02 * currentPrice;
    const lowExtra = Math.random() * 0.02 * currentPrice;
    const high = Math.max(open, close) + highExtra;
    const low = Math.min(open, close) - lowExtra;
    
    // 成交额（万元）- 随机生成，范围在 1000万 到 50000万 之间
    const baseAmount = 1000 + Math.random() * 49000;
    const amount = baseAmount * (1 + Math.abs(change) * 5); // 波动大时成交额更高
    
    // 成交量（手）= 成交额 / 平均价
    const avgPrice = (high + low) / 2;
    const volume = Math.round((amount * 10000) / avgPrice / 100);
    
    // 换手率（%）- 随机生成 0.5% 到 10%
    const turnoverRate = 0.5 + Math.random() * 9.5;
    
    // 计算涨跌幅和涨跌额
    const changeAmount = close - open;
    const changePercent = (changeAmount / open) * 100;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      close: Math.round(close * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      volume,
      amount: Math.round(amount * 100) / 100,
      turnoverRate: Math.round(turnoverRate * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      changeAmount: Math.round(changeAmount * 100) / 100,
    });
    
    currentPrice = close;
  }
  
  return data;
}

// 模拟A股股票数据
export const mockStocks: Stock[] = [
  {
    info: {
      code: '600519',
      name: '贵州茅台',
      market: 'SH',
      industry: '白酒',
      totalShares: 125619.78,
      floatShares: 125619.78,
    },
    data: 贵州茅台Data, // 真实历史数据
  },
  {
    info: {
      code: '000858',
      name: '五粮液',
      market: 'SZ',
      industry: '白酒',
      totalShares: 388146.68,
      floatShares: 388146.68,
    },
    data: generateStockData(365, 160),
  },
  {
    info: {
      code: '601318',
      name: '中国平安',
      market: 'SH',
      industry: '保险',
      totalShares: 1828059.37,
      floatShares: 1828059.37,
    },
    data: generateStockData(365, 50),
  },
  {
    info: {
      code: '000001',
      name: '平安银行',
      market: 'SZ',
      industry: '银行',
      totalShares: 1940481.90,
      floatShares: 1940481.90,
    },
    data: generateStockData(365, 12),
  },
  {
    info: {
      code: '600036',
      name: '招商银行',
      market: 'SH',
      industry: '银行',
      totalShares: 252199.46,
      floatShares: 252199.46,
    },
    data: generateStockData(365, 35),
  },
  {
    info: {
      code: '000333',
      name: '美的集团',
      market: 'SZ',
      industry: '家电',
      totalShares: 697363.58,
      floatShares: 697363.58,
    },
    data: generateStockData(365, 60),
  },
  {
    info: {
      code: '002415',
      name: '海康威视',
      market: 'SZ',
      industry: '电子设备',
      totalShares: 933324.48,
      floatShares: 933324.48,
    },
    data: generateStockData(365, 35),
  },
  {
    info: {
      code: '603259',
      name: '药明康德',
      market: 'SH',
      industry: '医药',
      totalShares: 295687.86,
      floatShares: 295687.86,
    },
    data: generateStockData(365, 75),
  },
];

// 获取所有股票列表（基本信息）
export function getStockList(): StockInfo[] {
  return mockStocks.map(stock => stock.info);
}

// 根据股票代码获取股票数据
export function getStockByCode(code: string): Stock | undefined {
  return mockStocks.find(stock => stock.info.code === code);
}

// 根据股票名称搜索
export function searchStocks(keyword: string): StockInfo[] {
  const lowerKeyword = keyword.toLowerCase();
  return mockStocks
    .filter(stock => 
      stock.info.code.includes(keyword) || 
      stock.info.name.toLowerCase().includes(lowerKeyword)
    )
    .map(stock => stock.info);
}
