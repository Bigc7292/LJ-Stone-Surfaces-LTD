const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    channel: 'chrome'
  });
  const page = await browser.newPage();
  
  console.log('Opening application...');
  await page.goto('http://localhost:3010');
  await page.waitForLoadState('networkidle');
  console.log('Page loaded');
  
  // Scroll down to find the visualizer section
  console.log('Scrolling to visualizer...');
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(1000);
  
  // Take screenshot of visualizer area
  await page.screenshot({ path: 'test-visualizer.png' });
  console.log('Visualizer screenshot saved');
  
  // Look for file input
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    console.log('Found file input, uploading image...');
    await fileInput.setInputFiles('C:\\Users\\toplo\\AppData\\Roaming\\Qoder\\SharedClientCache\\cache\\images\\8938c7a4\\WhatsApp Image 2025-12-21 at 18.39.01-cdcfbbfe.jpg');
    console.log('Image uploaded');
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-after-upload.png' });
    console.log('Screenshot after upload saved');
    
    // Look for Apply Transformation button
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      console.log(`Button: ${text?.trim()}`);
      if (text?.includes('Apply Transformation')) {
        console.log('Clicking Apply Transformation...');
        await btn.click();
        break;
      }
    }
    
    // Wait for AI processing
    await page.waitForTimeout(20000);
    
    // Scroll back to visualizer and take final screenshot
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-result.png' });
    console.log('Final screenshot saved');
  } else {
    console.log('No file input found');
  }
  
  await browser.close();
  console.log('Done');
})();
