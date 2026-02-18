import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 东方财富股票搜索API
      '/api/suggest': {
        target: 'https://searchapi.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/suggest/, '/api/suggest/get'),
      },
      // 东方财富股票列表API
      '/api/clist': {
        target: 'https://push2.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/clist/, '/api/qt/clist/get'),
      },
      // 东方财富K线数据API
      '/api/kline': {
        target: 'https://push2his.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kline/, '/api/qt/stock/kline/get'),
      },
      // 东方财富股票信息API
      '/api/stock': {
        target: 'https://push2.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stock/, '/api/qt/stock/get'),
      },
    },
  },
})
