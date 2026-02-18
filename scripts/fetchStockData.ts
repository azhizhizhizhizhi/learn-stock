/**
 * 从东方财富API获取股票历史数据
 * 运行: npx tsx scripts/fetchStockData.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 东方财富K线数据API
const EASTMONEY_KLINE_API = 'https://push2his.eastmoney.com/api/qt/stock/kline/get';

interface KlineData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  amount: number;
  turnoverRate: number;
}

interface EastMoneyResponse {
  data?: {
    klines?: string[];
  };
}

// 股票配置
const STOCKS = [
  { code: '600519', name: '贵州茅台', market: '1', totalShares: 125619.78, floatShares: 125619.78, industry: '白酒' },
];

/**
 * 从东方财富获取K线数据
 */
async function fetchKlineData(secid: string, days: number = 365): Promise<KlineData[]> {
  const url = `${EASTMONEY_KLINE_API}?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63&klt=101&fqt=1&end=20500101&lmt=${days}`;
  
  console.log(`正在获取数据: ${url}`);
  
  try {
    const response = await fetch(url);
    const result: EastMoneyResponse = await response.json();
    
    if (!result.data?.klines) {
      throw new Error('获取数据失败: 响应格式不正确');
    }
    
    // 解析K线数据
    // 格式: 日期,开盘,收盘,最高,最低,成交量,成交额,振幅,涨跌幅,涨跌额,换手率
    const klines: KlineData[] = result.data.klines.map((line: string) => {
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
      };
    });
    
    console.log(`成功获取 ${klines.length} 条数据`);
    return klines;
  } catch (error) {
    console.error('获取数据失败:', error);
    throw error;
  }
}

/**
 * 生成数据文件内容
 */
function generateDataFileContent(stockInfo: typeof STOCKS[0], klineData: KlineData[]): string {
  return `/**
 * ${stockInfo.name} (${stockInfo.code}) 真实历史数据
 * 数据来源: 东方财富网
 * 生成时间: ${new Date().toLocaleString('zh-CN')}
 * 数据条数: ${klineData.length}
 */

import type { StockData } from '../types/stock';

export const ${stockInfo.name.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '')}Data: StockData[] = ${JSON.stringify(klineData, null, 2)};
`;
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(50));
  console.log('股票数据获取脚本');
  console.log('='.repeat(50));
  
  for (const stock of STOCKS) {
    console.log(`\n正在获取 ${stock.name} (${stock.code}) 的数据...`);
    
    try {
      const secid = `${stock.market}.${stock.code}`;
      const klineData = await fetchKlineData(secid, 365);
      
      // 生成文件内容
      const fileContent = generateDataFileContent(stock, klineData);
      
      // 保存文件
      const outputPath = path.join(__dirname, '..', 'src', 'data', `real_${stock.code}.ts`);
      fs.writeFileSync(outputPath, fileContent, 'utf-8');
      
      console.log(`数据已保存到: ${outputPath}`);
      
      // 打印数据统计
      const prices = klineData.map(d => d.close);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgAmount = klineData.reduce((sum, d) => sum + d.amount, 0) / klineData.length;
      
      console.log('\n数据统计:');
      console.log(`  价格区间: ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`);
      console.log(`  平均价: ${(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}`);
      console.log(`  平均成交额: ${(avgAmount / 10000).toFixed(2)} 亿`);
      console.log(`  数据条数: ${klineData.length}`);
      
    } catch (error) {
      console.error(`获取 ${stock.name} 数据失败:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('数据获取完成！');
  console.log('='.repeat(50));
}

main().catch(console.error);
