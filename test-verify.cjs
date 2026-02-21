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
  
  // Scroll down to visualizer
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(1000);
  
  // Upload the kitchen image
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    console.log('Uploading kitchen image...');
    await fileInput.setInputFiles('C:\\Users\\toplo\\AppData\\Roaming\\Qoder\\SharedClientCache\\cache\\images\\8938c7a4\\WhatsApp Image 2025-12-21 at 18.39.01-cdcfbbfe.jpg');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'step1-uploaded.png' });
    console.log('Step 1: Image uploaded');
    
    // Click Apply Transformation
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text?.includes('Apply Transformation')) {
        console.log('Clicking Apply Transformation...');
        await btn.click();
        break;
      }
    }
    
    // Wait for AI processing
    await page.waitForTimeout(20000);
    
    // Take screenshot of result
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step2-ai-result.png' });
    console.log('Step 2: AI result screenshot taken');
    
    // Check for Walk Around Room button (video)
    const walkBtn = await page.$('button:has-text("Walk Around")');
    if (walkBtn) {
      console.log('Found Walk Around Room button - clicking for video...');
      await walkBtn.click();
      await page.waitForTimeout(10000);
      await page.screenshot({ path: 'step3-video-result.png' });
      console.log('Step 3: Video/3D walkthrough screenshot');
    } else {
      console.log('No Walk Around button found');
    }
    
  } else {
    console.log('No file input found');
  }
  
  await browser.close();
  console.log('Done - check the screenshots');
})();
