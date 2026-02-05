// Vercel Serverless Function - Binance Futures API Proxy
// Handles dynamic paths like /api/fapi/v1/klines, /api/fapi/v1/ticker/price

export const config = {
    runtime: 'edge',
    regions: ['sin1'], // Singapore - Binance allowed region
};

export default async function handler(req) {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);

        // Extract the path after /api (e.g., /fapi/v1/klines -> /fapi/v1/klines)
        const binancePath = url.pathname.replace(/^\/api/, '');
        const queryString = url.search;

        const binanceUrl = `https://fapi.binance.com${binancePath}${queryString}`;

        console.log('[Binance Proxy] Fetching:', binanceUrl);

        const response = await fetch(binanceUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
        });

        const data = await response.text();

        return new Response(data, {
            status: response.status,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('[Binance Proxy] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            },
        });
    }
}
