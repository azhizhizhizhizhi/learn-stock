import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { StockData, TooltipData } from '../types/stock';

interface StockChartProps {
  data: StockData[];
}

// 图表配置
const CHART_CONFIG = {
  padding: { top: 40, right: 60, bottom: 40, left: 80 },
  baseWidth: 30,
  minCandleWidth: 2,
  maxCandleWidth: 100,
  verticalLineSpacing: 4,
  minZoom: 0.1,
  maxZoom: 5,
  zoomStep: 0.2,
  colors: {
    rising: '#ef4444',
    falling: '#22c55e',
    flat: '#9ca3af',
    openLine: '#eab308',
    closeLine: '#3b82f6',
    verticalLine: 'rgba(0, 0, 0, 0.6)',
    background: '#ffffff',
    gridLine: '#e5e7eb',
    text: '#374151',
  },
};

const StockChart: React.FC<StockChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 500 });
  const candlePositionsRef = useRef<Array<{ x: number; width: number; data: StockData }>>([]);
  
  // 缩放和滚动状态
  const [zoom, setZoom] = useState(1);
  const [scrollPosition, setScrollPosition] = useState(0); // 0-100 百分比

  // 计算平均成交额
  const calculateAverageAmount = useCallback((stockData: StockData[]): number => {
    if (stockData.length === 0) return 0;
    const total = stockData.reduce((sum, d) => sum + d.amount, 0);
    return total / stockData.length;
  }, []);

  // 计算蜡烛宽度
  const calculateCandleWidth = useCallback((amount: number, avgAmount: number): number => {
    if (avgAmount === 0) return CHART_CONFIG.baseWidth;
    const ratio = amount / avgAmount;
    const width = CHART_CONFIG.baseWidth * ratio;
    return Math.max(CHART_CONFIG.minCandleWidth, Math.min(CHART_CONFIG.maxCandleWidth, width));
  }, []);

  // 绘制图表
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    const { padding, colors } = CHART_CONFIG;

    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const allPrices = data.flatMap((d) => [d.high, d.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.1;
    const adjustedMinPrice = minPrice - pricePadding;
    const adjustedMaxPrice = maxPrice + pricePadding;
    const adjustedPriceRange = adjustedMaxPrice - adjustedMinPrice;

    const avgAmount = calculateAverageAmount(data);

    // 计算未缩放的总宽度
    const totalCandlesWidth = data.reduce((sum, d) => {
      return sum + calculateCandleWidth(d.amount, avgAmount);
    }, 0);

    // 计算缩放后的总宽度
    const scaledTotalWidth = totalCandlesWidth * zoom;
    
    // 计算最大可滚动距离（只有当缩放后超出图表区域时才需要滚动）
    const maxScrollOffset = Math.max(0, scaledTotalWidth - chartWidth);
    
    // 根据滚动位置计算偏移量
    const panOffset = - (maxScrollOffset * scrollPosition / 100);

    // 绘制网格线和Y轴标签
    ctx.strokeStyle = colors.gridLine;
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.text;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';

    const priceSteps = 5;
    for (let i = 0; i <= priceSteps; i++) {
      const price = adjustedMinPrice + (adjustedPriceRange * i) / priceSteps;
      const y = padding.top + chartHeight - (chartHeight * i) / priceSteps;

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText(price.toFixed(2), padding.left - 10, y + 4);
    }

    // 设置裁剪区域
    ctx.save();
    ctx.beginPath();
    ctx.rect(padding.left, padding.top, chartWidth, chartHeight);
    ctx.clip();

    // 绘制蜡烛
    candlePositionsRef.current = [];
    let currentX = padding.left + panOffset;

    data.forEach((stockData) => {
      const candleWidth = calculateCandleWidth(stockData.amount, avgAmount) * zoom;
      const scaledWidth = Math.max(1, candleWidth);

      // 仍然记录所有蜡烛位置用于悬浮检测
      candlePositionsRef.current.push({
        x: currentX,
        width: scaledWidth,
        data: stockData,
      });

      // 跳过不可见的蜡烛（不绘制，但位置仍记录）
      if (currentX + scaledWidth < padding.left || currentX > width - padding.right) {
        currentX += scaledWidth;
        return;
      }

      const highY = padding.top + chartHeight * (1 - (stockData.high - adjustedMinPrice) / adjustedPriceRange);
      const lowY = padding.top + chartHeight * (1 - (stockData.low - adjustedMinPrice) / adjustedPriceRange);
      const openY = padding.top + chartHeight * (1 - (stockData.open - adjustedMinPrice) / adjustedPriceRange);
      const closeY = padding.top + chartHeight * (1 - (stockData.close - adjustedMinPrice) / adjustedPriceRange);

      const candleHeight = Math.max(1, lowY - highY);
      const isRising = stockData.close >= stockData.open;

      // 绘制蜡烛背景
      ctx.fillStyle = isRising ? colors.rising : colors.falling;
      ctx.fillRect(currentX, highY, scaledWidth, candleHeight);

      // 绘制灰色竖线
      ctx.strokeStyle = colors.verticalLine;
      ctx.lineWidth = 1;
      const lineSpacing = CHART_CONFIG.verticalLineSpacing;
      const numLines = Math.floor(scaledWidth / lineSpacing);

      for (let i = 0; i <= numLines; i++) {
        const lineX = currentX + i * lineSpacing;
        if (lineX <= currentX + scaledWidth) {
          ctx.beginPath();
          ctx.moveTo(lineX, highY);
          ctx.lineTo(lineX, highY + candleHeight);
          ctx.stroke();
        }
      }

      // 绘制开盘价横线（如果等于最高价或最低价，加粗填充）
      if (scaledWidth > 3) {
        const openAtHigh = Math.abs(stockData.open - stockData.high) < 0.01;
        const openAtLow = Math.abs(stockData.open - stockData.low) < 0.01;
        const closeAtHigh = Math.abs(stockData.close - stockData.high) < 0.01;
        const closeAtLow = Math.abs(stockData.close - stockData.low) < 0.01;

        // 开盘价线
        ctx.strokeStyle = colors.openLine;
        ctx.lineWidth = (openAtHigh || openAtLow) ? 4 : (scaledWidth > 10 ? 2 : 1);
        ctx.beginPath();
        ctx.moveTo(currentX, openY);
        ctx.lineTo(currentX + scaledWidth, openY);
        ctx.stroke();

        // 收盘价线
        ctx.strokeStyle = colors.closeLine;
        ctx.lineWidth = (closeAtHigh || closeAtLow) ? 4 : (scaledWidth > 10 ? 2 : 1);
        ctx.beginPath();
        ctx.moveTo(currentX, closeY);
        ctx.lineTo(currentX + scaledWidth, closeY);
        ctx.stroke();
      }

      // 绘制蜡烛边框
      ctx.strokeStyle = isRising ? colors.rising : colors.falling;
      ctx.lineWidth = 1;
      ctx.strokeRect(currentX, highY, scaledWidth, candleHeight);

      currentX += scaledWidth;
    });

    ctx.restore();

    // 绘制X轴日期标签
    ctx.fillStyle = colors.text;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';

    const labelInterval = Math.ceil(data.length / 8);
    let labelX = padding.left + panOffset;

    data.forEach((stockData, index) => {
      const candleWidth = calculateCandleWidth(stockData.amount, avgAmount) * zoom;
      
      if (index % labelInterval === 0 && labelX >= padding.left && labelX <= width - padding.right) {
        ctx.fillText(stockData.date.slice(5), labelX + candleWidth / 2, height - padding.bottom + 20);
      }
      
      labelX += candleWidth;
    });
  }, [data, canvasSize, calculateAverageAmount, calculateCandleWidth, zoom, scrollPosition]);

  // 处理窗口大小变化
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setCanvasSize({ width, height: 500 });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 绘制图表
  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // 鼠标移动处理 - 悬浮提示
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const { padding } = CHART_CONFIG;
    const chartWidth = canvasSize.width - padding.left - padding.right;

    // 只在图表区域内检测
    if (x < padding.left || x > padding.left + chartWidth) {
      setTooltip(null);
      return;
    }

    // 查找悬浮的蜡烛
    const candle = candlePositionsRef.current.find(
      (c) => x >= c.x && x <= c.x + c.width
    );

    if (candle) {
      setTooltip({
        x: e.clientX,
        y: e.clientY,
        data: candle.data,
        visible: true,
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  // 缩放控制
  const handleZoomIn = () => {
    setZoom(prev => Math.min(CHART_CONFIG.maxZoom, prev + CHART_CONFIG.zoomStep));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(CHART_CONFIG.minZoom, prev - CHART_CONFIG.zoomStep));
  };

  const handleReset = () => {
    setZoom(1);
    setScrollPosition(0);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(parseFloat(e.target.value));
  };

  // 滚动条控制
  const handleScrollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScrollPosition(parseFloat(e.target.value));
  };

  // 计算是否需要显示滚动条
  const avgAmount = calculateAverageAmount(data);
  const totalCandlesWidth = data.reduce((sum, d) => {
    return sum + calculateCandleWidth(d.amount, avgAmount);
  }, 0);
  const scaledTotalWidth = totalCandlesWidth * zoom;
  const chartWidth = canvasSize.width - CHART_CONFIG.padding.left - CHART_CONFIG.padding.right;
  const needsScrollbar = scaledTotalWidth > chartWidth;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">请搜索并选择一只股票查看图表</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 图表标题 */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">压缩图（成交量加权）</h3>
        <p className="text-sm text-gray-500">蜡烛宽度 = 成交额占比 | 高度 = 价格区间 | 共 {data.length} 个交易日</p>
      </div>

      {/* 缩放控制 */}
      <div className="px-4 py-2 flex items-center gap-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            title="缩小"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <input
            type="range"
            min={CHART_CONFIG.minZoom}
            max={CHART_CONFIG.maxZoom}
            step={CHART_CONFIG.zoomStep}
            value={zoom}
            onChange={handleSliderChange}
            className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            title="放大"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <span className="text-sm text-gray-600 min-w-[60px]">{(zoom * 100).toFixed(0)}%</span>
        <button
          onClick={handleReset}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        >
          重置
        </button>
      </div>

      {/* 图例 */}
      <div className="px-4 py-2 flex items-center gap-6 text-sm border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-gray-600">上涨</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-600">下跌</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-yellow-500"></div>
          <span className="text-gray-600">开盘价</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-blue-500"></div>
          <span className="text-gray-600">收盘价</span>
        </div>
      </div>

      {/* Canvas 图表 */}
      <div className="overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair"
        />
      </div>

      {/* 底部滚动条 */}
      {needsScrollbar && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">◄</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={scrollPosition}
              onChange={handleScrollChange}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-500">►</span>
          </div>
          <div className="text-center text-xs text-gray-400 mt-1">
            拖动滑块查看不同时间段
          </div>
        </div>
      )}

      {/* 悬浮提示框 */}
      {tooltip && tooltip.visible && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 pointer-events-none min-w-[280px]"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y - 10,
            transform: tooltip.y > window.innerHeight / 2 ? 'translateY(-100%)' : 'none',
          }}
        >
          <div className="text-sm font-semibold text-gray-800 mb-2 pb-2 border-b border-gray-100">
            {tooltip.data.date}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">开盘价：</span>
              <span className="font-medium text-yellow-600">{tooltip.data.open.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">收盘价：</span>
              <span className="font-medium text-blue-600">{tooltip.data.close.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">最高价：</span>
              <span className="font-medium text-red-600">{tooltip.data.high.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">最低价：</span>
              <span className="font-medium text-green-600">{tooltip.data.low.toFixed(2)}</span>
            </div>
            <div className="flex justify-between col-span-2 pt-1 border-t border-gray-100">
              <span className="text-gray-500">涨跌幅：</span>
              <span className={`font-medium ${(tooltip.data.changePercent ?? 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {(tooltip.data.changePercent ?? 0) >= 0 ? '+' : ''}{(tooltip.data.changePercent ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-gray-500">涨跌额：</span>
              <span className={`font-medium ${(tooltip.data.changeAmount ?? 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {(tooltip.data.changeAmount ?? 0) >= 0 ? '+' : ''}{(tooltip.data.changeAmount ?? 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between col-span-2 pt-1 border-t border-gray-100">
              <span className="text-gray-500">成交量：</span>
              <span className="font-medium">{(tooltip.data.volume / 10000).toFixed(2)} 万手</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-gray-500">成交额：</span>
              <span className="font-medium">{(tooltip.data.amount / 10000).toFixed(2)} 亿</span>
            </div>
            <div className="flex justify-between col-span-2 pt-1 border-t border-gray-100">
              <span className="text-gray-500">换手率：</span>
              <span className="font-medium text-purple-600">{tooltip.data.turnoverRate.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockChart;
