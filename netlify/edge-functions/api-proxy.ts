/**
 * Netlify Edge Function - API 代理
 * 用于处理跨域 API 请求，支持自定义域名
 */

// API 端点配置
const API_ENDPOINTS: Record<string, { target: string; pathRewrite: string }> = {
  '/api/suggest': {
    target: 'https://searchapi.eastmoney.com',
    pathRewrite: '/api/suggest/get',
  },
  '/api/clist': {
    target: 'https://push2.eastmoney.com',
    pathRewrite: '/api/qt/clist/get',
  },
  '/api/kline': {
    target: 'https://push2his.eastmoney.com',
    pathRewrite: '/api/qt/stock/kline/get',
  },
  '/api/stock': {
    target: 'https://push2.eastmoney.com',
    pathRewrite: '/api/qt/stock/get',
  },
};

export default async (request: Request) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 找到匹配的 API 端点
  let matchedEndpoint: { target: string; pathRewrite: string } | null = null;
  
  for (const [prefix, config] of Object.entries(API_ENDPOINTS)) {
    if (pathname.startsWith(prefix)) {
      matchedEndpoint = config;
      break;
    }
  }

  if (!matchedEndpoint) {
    return new Response(JSON.stringify({ error: 'Unknown API endpoint' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // 构建目标 URL
  const targetUrl = `${matchedEndpoint.target}${matchedEndpoint.pathRewrite}${url.search}`;

  try {
    // 转发请求，添加必要的请求头
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://quote.eastmoney.com/',
        'Origin': 'https://quote.eastmoney.com',
      },
    });

    // 获取响应内容
    const responseData = await response.text();

    // 返回响应，添加 CORS 头
    return new Response(responseData, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Proxy request failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

// 处理 OPTIONS 预检请求
export const config = {
  path: '/api/*',
  excludedPath: '/api',
};
