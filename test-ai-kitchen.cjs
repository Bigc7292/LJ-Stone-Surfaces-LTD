const fs = require('fs');
const http = require('http');

const imagePath = 'C:\\Users\\toplo\\AppData\\Roaming\\Qoder\\SharedClientCache\\cache\\images\\8938c7a4\\WhatsApp Image 2025-12-21 at 18.39.01-cdcfbbfe.jpg';

console.log('Reading image file...');
const imageBuffer = fs.readFileSync(imagePath);
const base64 = imageBuffer.toString('base64');

console.log('Image size:', imageBuffer.length, 'bytes');
console.log('Base64 length:', base64.length, 'characters');

const requestData = {
  roomImage: base64,
  stoneName: 'Calacatta Gold',
  stoneCategory: 'Quartz'
};

const data = JSON.stringify(requestData);

console.log('Sending request to AI...');

const req = http.request({
  hostname: 'localhost',
  port: 3010,
  path: '/api/grok/generate-image',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(data);
req.end();

console.log('Request sent, waiting for response...');
