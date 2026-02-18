// 股票数据类型定义
export interface StockData {
  date: string;           // 交易日期
  open: number;           // 开盘价
  close: number;          // 收盘价
  high: number;           // 最高价
  low: number;            // 最低价
  volume: number;         // 成交量（手）
  amount: number;         // 成交额（元）
  turnoverRate: number;   // 换手率（%）
  changePercent?: number;  // 涨跌幅（%）
  changeAmount?: number;   // 涨跌额（元）
}

// 股票基本信息
export interface StockInfo {
  code: string;           // 股票代码
  name: string;           // 股票名称
  market: 'SH' | 'SZ';    // 市场：上海/深圳
  industry: string;       // 所属行业
  totalShares: number;    // 总股本（万股）
  floatShares: number;    // 流通股本（万股）
}

// 股票完整数据
export interface Stock {
  info: StockInfo;
  data: StockData[];
}

// 图表悬浮信息
export interface TooltipData {
  x: number;
  y: number;
  data: StockData;
  visible: boolean;
}

// 蜡烛图绘制参数
export interface CandleParams {
  x: number;
  y: number;
  width: number;
  height: number;
  data: StockData;
  isRising: boolean;  // 是否上涨（收盘价 > 开盘价）
}
