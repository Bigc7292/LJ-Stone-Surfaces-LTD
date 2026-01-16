const { stoneSurfaceFlow } = require('./lib/index.js');
const { runFlow } = require('genkit');

async function testFlow() {
  const input = {
    userImageBase64: 'https://i.postimg.cc/R6K2HKqg/Whats-App-Image-2026-01-01-at-23-40-43.jpg',
    materialType: 'Quartz',
    finish: 'Polished'
  };

  try {
    const result = await runFlow(stoneSurfaceFlow, input);
    console.log('Flow completed successfully:', result);
  } catch (error) {
    console.error('Flow failed:', error);
  }
}

testFlow();
