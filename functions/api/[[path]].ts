/**
 * Cloudflare Pages Functions - API 代理
 * 处理所有 /api/* 请求，代理到东方财富 API
 */

interface Env {
  // Cloudflare 环境变量（如需要）
}

// API 端点映射
const API_ENDPOINTS: Record<string, { target: string; rewrite: (path: string) => string }> = {
  '/api/suggest': {
    target: 'https://searchapi.eastmoney.com',
    rewrite: (path) => path.replace('/api/suggest', '/api/suggest/get'),
  },
  '/api/clist': {
    target: 'https://push2.eastmoney.com',
    rewrite: (path) => path.replace('/api/clist', '/api/qt/clist/get'),
  },
  '/api/kline': {
    target: 'https://push2his.eastmoney.com',
    rewrite: (path) => path.replace('/api/kline', '/api/qt/stock/kline/get'),
  },
  '/api/stock': {
    target: 'https://push2.eastmoney.com',
    rewrite: (path) => path.replace('/api/stock', '/api/qt/stock/get'),
  },
};

export async function onRequest(context: {
  request: Request;
  env: Env;
  params: { path: string | string[] };
}): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 找到匹配的 API 端点
  let matchedEndpoint: { target: string; rewrite: (path: string) => string } | null = null;
  
  for (const [prefix, config] of Object.entries(API_ENDPOINTS)) {
    if (pathname.startsWith(prefix)) {
      matchedEndpoint = config;
      break;
    }
  }

  if (!matchedEndpoint) {
    return new Response(JSON.stringify({ error: 'Unknown API endpoint' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 构建目标 URL
  const rewrittenPath = matchedEndpoint.rewrite(pathname);
  const targetUrl = `${matchedEndpoint.target}${rewrittenPath}${url.search}`;

  try {
    // 转发请求
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

    // 复制响应并添加 CORS 头
    const modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    // 添加 CORS 头以允许跨域访问
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return modifiedResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Proxy request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// 处理 OPTIONS 预检请求
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
