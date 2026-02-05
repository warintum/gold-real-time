// Netlify Function - Binance Futures API Proxy

exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // ดึง path จาก query parameter
    const path = event.path.replace('/.netlify/functions/binance-proxy', '');
    const queryString = event.rawQuery;
    
    // สร้าง URL ไปยัง Binance
    const binanceUrl = `https://fapi.binance.com${path}${queryString ? '?' + queryString : ''}`;
    
    console.log('Proxying to:', binanceUrl);

    // เรียก Binance API
    const response = await fetch(binanceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    const data = await response.text();

    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: data,
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
