const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('Starting E2E verification script...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const testImagePath = path.resolve(__dirname, 'sample_kitchen.jpg');
    console.log('Target test image path:', testImagePath);

    try {
        console.log('Opening application at http://localhost:3010...');
        await page.goto('http://localhost:3010', { waitUntil: 'networkidle', timeout: 60000 });

        console.log('Page loaded. Scrolling to AI Experience...');
        await page.evaluate(() => {
            const el = document.getElementById('ai-experience');
            if (el) el.scrollIntoView();
        });
        await page.waitForTimeout(1000);

        // 1. Programmatic Upload
        console.log('Attempting programmatic upload...');
        const fileInput = await page.$('#base-room-upload');
        if (fileInput) {
            await fileInput.setInputFiles(testImagePath);
            console.log('SUCCESS: Image injected into file input.');
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'verify_debug_upload_ok.png' });
        } else {
            throw new Error('Could not find #base-room-upload input');
        }

        // 2. Select Stone
        console.log('Selecting a stone material...');
        const stoneToggle = await page.$('div[role="button"]:has-text("Taj Mahal"), div[role="button"]:has-text("Quartzite")');
        if (stoneToggle) {
            await stoneToggle.click();
            console.log('Stone selected.');
            await page.waitForTimeout(1000);
        }

        // 3. Apply Transformation
        console.log('Clicking Apply Transformation...');
        const applyBtn = await page.getByRole('button', { name: /Apply Transformation/i });
        if (await applyBtn.isVisible()) {
            await applyBtn.click();
            console.log('Transformation started. Waiting 120s for AI pipeline...');
            await page.waitForTimeout(120000);
            await page.screenshot({ path: 'verify_final_result_check.png', fullPage: true });
        } else {
            throw new Error('Apply Transformation button not found or visible');
        }

        // 4. Verify Overlay Absence in Main View
        const mainOverlay = await page.$('h4:has-text("Material Profile")');
        if (mainOverlay) {
            console.log('CHECK: Material Profile overlay is visible (verifying if blocking)...');
            await page.screenshot({ path: 'verify_overlay_status.png' });
        } else {
            console.log('SUCCESS: Material Profile overlay is NOT in the main view.');
        }

        // 5. Open Full Screen
        console.log('Attempting to open Full Screen mode...');
        const fullScreenBtn = await page.getByRole('button', { name: /Full Screen/i });
        if (await fullScreenBtn.isVisible()) {
            await fullScreenBtn.click();
            await page.waitForTimeout(3000);
            console.log('FullScreen opened. Verifying toggleable info...');
            const fsOverlay = await page.$('h4:has-text("Material Profile")');
            if (fsOverlay) {
                console.log('SUCCESS: Material Profile overlay found in FullScreen mode.');
                await page.screenshot({ path: 'verify_final_fullscreen_ok.png' });
            }
        } else {
            console.log('Full Screen button not visible yet - check final_result_check.png');
        }

    } catch (err) {
        console.error('ERROR during verification:', err.message);
        await page.screenshot({ path: 'verify_error_screenshot.png' });
    } finally {
        await browser.close();
        console.log('Verification script finished.');
    }
})();
