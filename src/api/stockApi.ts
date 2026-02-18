/**
 * 股票数据 API 服务
 * 数据来源：东方财富网
 */

import type { StockData, StockInfo } from '../types/stock';

// API 响应类型定义
interface SuggestResponse {
  QuotationCodeTable: {
    Data: Array<{
      Code: string;           // 股票代码
      Name: string;           // 股票名称
      PinYin: string;         // 拼音
      ID: string;             // ID
      JYS: string;            // 交易所
      Classify: string;       // 分类 (AStock=A股)
      MarketType: string;     // 市场类型: 1=沪市, 0=深市
      SecurityTypeName: string; // 证券类型名称
      SecurityType: string;   // 证券类型
      MktNum: string;         // 市场编号
      QuoteID: string;        // 行情ID
      UnifiedCode: string;    // 统一代码
    }>;
    Status: number;
    Message: string;
    TotalCount: number;
  };
}

interface KlineResponse {
  data?: {
    klines?: string[];  // K线数据数组
    code?: number;
  };
}

interface StockListResponse {
  data?: {
    diff?: Array<{
      f12: string;  // 代码
      f14: string;  // 名称
      f2: number;   // 最新价
      f3: number;   // 涨跌幅
      f4: number;   // 涨跌额
      f5: number;   // 成交量
      f6: number;   // 成交额
      f15: number;  // 最高
      f16: number;  // 最低
      f17: number;  // 开盘
      f18: number;  // 收盘
      f23: number;  // 市盈率
      f116: number; // 总股本
      f117: number; // 流通股
    }>;
  };
}

/**
 * 搜索股票
 * @param keyword 搜索关键词（股票代码或名称）
 * @returns 股票信息列表
 */
export async function searchStocks(keyword: string): Promise<StockInfo[]> {
  if (!keyword || keyword.trim() === '') {
    return [];
  }

  try {
    const response = await fetch(
      `/api/suggest?input=${encodeURIComponent(keyword)}&type=14&token=D43BF722C8E33BDC908FB2415548CA3`
    );
    
    if (!response.ok) {
      throw new Error(`搜索请求失败: ${response.status}`);
    }

    const result: SuggestResponse = await response.json();
    
    if (!result.QuotationCodeTable?.Data) {
      return [];
    }

    // 过滤只保留A股（沪深市场）
    // MarketType: 1=沪A, 2=深A
    // Classify: AStock=A股
    return result.QuotationCodeTable.Data
      .filter(item => 
        item.Classify === 'AStock' && 
        (item.MarketType === '1' || item.MarketType === '2')
      )
      .map(item => ({
        code: item.Code,
        name: item.Name,
        market: (item.MarketType === '1' ? 'SH' : 'SZ') as 'SH' | 'SZ',
        industry: '', // 搜索结果不包含行业信息
        totalShares: 0,
        floatShares: 0,
      }));
  } catch (error) {
    console.error('搜索股票失败:', error);
    return [];
  }
}

/**
 * 获取股票K线数据
 * @param code 股票代码
 * @param market 市场代码 (SH=1, SZ=0)
 * @param days 天数 (默认365天)
 * @returns K线数据数组
 */
export async function getKlineData(
  code: string, 
  market: string = 'SH', 
  days: number = 365
): Promise<StockData[]> {
  // 转换市场代码
  const marketCode = market === 'SH' ? '1' : '0';
  const secid = `${marketCode}.${code}`;

  try {
    const response = await fetch(
      `/api/kline?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63&klt=101&fqt=1&end=20500101&lmt=${days}`
    );

    if (!response.ok) {
      throw new Error(`获取K线数据失败: ${response.status}`);
    }

    const result: KlineResponse = await response.json();

    if (!result.data?.klines) {
      throw new Error('K线数据格式不正确');
    }

    // 解析K线数据
    // 格式: 日期,开盘,收盘,最高,最低,成交量,成交额,振幅,涨跌幅,涨跌额,换手率
    return result.data.klines.map((line: string) => {
      const parts = line.split(',');
      return {
        date: parts[0],
        open: parseFloat(parts[1]),
        close: parseFloat(parts[2]),
        high: parseFloat(parts[3]),
        low: parseFloat(parts[4]),
        volume: Math.round(parseFloat(parts[5]) / 100), // 转换为手
        amount: parseFloat(parts[6]) / 10000, // 转换为万元
        turnoverRate: parseFloat(parts[10]) || 0,
        changePercent: parseFloat(parts[8]) || 0,  // 涨跌幅（%）
        changeAmount: parseFloat(parts[9]) || 0,   // 涨跌额（元）
      };
    });
  } catch (error) {
    console.error('获取K线数据失败:', error);
    throw error;
  }
}

/**
 * 获取A股列表
 * @param market 市场类型 (1=沪A, 2=深A, 3=全部A股)
 * @returns 股票列表
 */
export async function getStockList(market: number = 3): Promise<StockInfo[]> {
  try {
    // 市场类型: 1=沪A, 2=深A, 3=全部A股
    const response = await fetch(
      `/api/clist?pn=1&pz=500&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:${market === 1 ? '1' : market === 2 ? '0' : '1,0'}+t:6,m:0,+t:80,m:0,+t:81,m:0,+t:82,m:0,+t:83,m:0,+t:2&fields=f12,f14,f2,f3,f4,f5,f6,f15,f16,f17,f18,f23,f116,f117`
    );

    if (!response.ok) {
      throw new Error(`获取股票列表失败: ${response.status}`);
    }

    const result: StockListResponse = await response.json();

    if (!result.data?.diff) {
      return [];
    }

    return result.data.diff.map(item => ({
      code: item.f12,
      name: item.f14,
      market: (item.f12.startsWith('6') ? 'SH' : 'SZ') as 'SH' | 'SZ',
      industry: '',
      totalShares: item.f116 || 0,
      floatShares: item.f117 || 0,
    }));
  } catch (error) {
    console.error('获取股票列表失败:', error);
    return [];
  }
}

/**
 * 获取股票实时信息
 * @param code 股票代码
 * @param market 市场代码
 * @returns 股票信息
 */
export async function getStockInfo(code: string, market: string = 'SH'): Promise<StockInfo | null> {
  const marketCode = market === 'SH' ? '1' : '0';
  const secid = `${marketCode}.${code}`;

  try {
    const response = await fetch(
      `/api/stock?secid=${secid}&fields=f12,f14,f2,f3,f4,f5,f6,f15,f16,f17,f18,f23,f116,f117`
    );

    if (!response.ok) {
      throw new Error(`获取股票信息失败: ${response.status}`);
    }

    const result = await response.json();

    if (!result.data) {
      return null;
    }

    return {
      code: result.data.f12 || code,
      name: result.data.f14 || '',
      market: market as 'SH' | 'SZ',
      industry: '',
      totalShares: result.data.f116 || 0,
      floatShares: result.data.f117 || 0,
    };
  } catch (error) {
    console.error('获取股票信息失败:', error);
    return null;
  }
}

/**
 * 根据股票代码判断市场
 */
export function getMarketByCode(code: string): 'SH' | 'SZ' {
  // 6开头 = 上海, 其他 = 深圳
  if (code.startsWith('6')) {
    return 'SH';
  }
  return 'SZ';
}
