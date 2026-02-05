// Cloudflare Worker - Binance Futures API Proxy
// รองรับทั้ง REST API และ WebSocket

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request (CORS preflight)
function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Main fetch handler
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const query = url.search;

    try {
      // กรองเฉพาะ API paths ที่อนุญาต
      if (!path.startsWith('/fapi/')) {
        return new Response(JSON.stringify({ 
          error: 'Invalid path. Only /fapi/* is allowed.' 
        }), {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }

      // สร้าง URL ไปยัง Binance Futures API
      const binanceUrl = `https://fapi.binance.com${path}${query}`;
      
      console.log(`Proxying: ${binanceUrl}`);

      // Forward request ไปยัง Binance พร้อม Headers ที่ดูเหมือน Browser จริง
      const response = await fetch(binanceUrl, {
        method: request.method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://www.binance.com/',
          'Origin': 'https://www.binance.com',
        },
      });

      // Clone response และเพิ่ม CORS headers
      const newHeaders = new Headers(response.headers);
      
      // ลบ headers ที่อาจทำให้เกิดปัญหา
      newHeaders.delete('content-encoding');
      newHeaders.delete('content-length');
      
      // เพิ่ม CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });

      return newResponse;

    } catch (error) {
      console.error('Proxy error:', error);
      return new Response(JSON.stringify({ 
        error: 'Proxy error', 
        message: error.message 
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};
