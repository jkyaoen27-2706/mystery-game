// Simple local CORS proxy (no dependencies). Run with: node local-cors-proxy.js
// It forwards requests to the target URL provided after the leading slash.
// Example: http://localhost:8080/https://example.com/api

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = process.env.PORT || 8080;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function makeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method,
      headers: options.headers
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks)
        });
      });
    });
    
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Get target URL from path (everything after the leading slash)
  let targetRaw = req.url.slice(1); // drop leading slash
  
  console.log('=== Proxy Request ===');
  console.log('Method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Target raw (first 100 chars):', targetRaw ? targetRaw.substring(0, 100) + '...' : 'EMPTY');
  
  if (!targetRaw) {
    console.log('ERROR: Missing target URL');
    res.writeHead(400);
    res.end('Missing target URL. Request URL: ' + req.url);
    return;
  }
  
  // Decode the URL (it should be encoded)
  try {
    targetRaw = decodeURIComponent(targetRaw);
    console.log('Decoded target (first 100 chars):', targetRaw.substring(0, 100) + '...');
  } catch (err) {
    console.log('URL decode error:', err.message);
    console.log('Using raw target as-is');
  }
  
  if (!targetRaw.startsWith('http://') && !targetRaw.startsWith('https://')) {
    console.log('ERROR: Invalid target URL format');
    console.log('Target starts with:', targetRaw.substring(0, 20));
    res.writeHead(400);
    res.end('Invalid target URL - must start with http:// or https://. Got: ' + targetRaw.substring(0, 100));
    return;
  }
  
  console.log('Target URL is valid, proceeding with request...');

  const target = targetRaw;

  try {
    const body = (req.method === 'GET' || req.method === 'HEAD') ? undefined : await readBody(req);
    
    const headers = {};
    Object.keys(req.headers).forEach(key => {
      if (key.toLowerCase() !== 'host') {
        headers[key] = req.headers[key];
      }
    });

    const upstream = await makeRequest(target, {
      method: req.method,
      headers: headers
    }, body);

    // Copy upstream headers
    Object.keys(upstream.headers).forEach(key => {
      res.setHeader(key, upstream.headers[key]);
    });
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(upstream.status);
    res.end(upstream.body);
  } catch (err) {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy error: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`Local CORS proxy running on http://localhost:${PORT}`);
  console.log('Keep this window open while using the mystery generator.');
});

