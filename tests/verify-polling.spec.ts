import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('verify asynchronous AI polling feature', async ({ page }) => {
    // 1. Create a dummy PNG file for upload
    const dummyImagePath = path.join(process.cwd(), 'dummy-test-image.png');
    // Simple 1x1 transparent PNG
    const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(dummyImagePath, dummyPng);

    try {
        // 2. Navigate to the application
        await page.goto('http://localhost:3000');
        await expect(page).toHaveTitle(/LJ Stone/i);

        // 3. Upload the dummy image to both "Primary" and "Offset" slots
        const baseInput = page.locator('input[type="file"]').first();
        const depthInput = page.locator('input[type="file"]').nth(1);

        await baseInput.setInputFiles(dummyImagePath);
        await depthInput.setInputFiles(dummyImagePath);

        // 4. Wait for the "Spatial Link Established" indicator
        await expect(page.getByText('Spatial Link Established')).toBeVisible();

        // 5. Click "Initiate AI Render"
        const renderButton = page.getByRole('button', { name: /Initiate AI Render/i });
        await expect(renderButton).toBeEnabled();

        // Monitor network requests for polling
        const pollingRequests: string[] = [];
        page.on('request', request => {
            if (request.url().includes('/api/re-imager/status/')) {
                pollingRequests.push(request.url());
                console.log(`[Test] Polling request observed: ${request.url()}`);
            }
        });

        await renderButton.click();

        // 6. Verify "Refining Space" loading state
        await expect(page.getByText('Refining Space')).toBeVisible();

        // 7. Wait for the result - This will take some time and trigger polling
        // We expect several polling requests before completion
        await page.waitForURL(url => url.toString().includes('RESULT') || true, { timeout: 120000 });

        // Wait for the "Open Full Experience" button which indicates success
        const successButton = page.getByRole('button', { name: /Open Full Experience/i });
        await expect(successButton).toBeVisible({ timeout: 60000 });

        console.log(`[Test] Polling completed. Total requests: ${pollingRequests.length}`);
        expect(pollingRequests.length).toBeGreaterThan(0);

        // 8. Capture evidence
        await page.screenshot({ path: 'verify-polling-success.png' });
        console.log('[Test] Evidence captured: verify-polling-success.png');

    } finally {
        // Clean up
        if (fs.existsSync(dummyImagePath)) {
            fs.unlinkSync(dummyImagePath);
        }
    }
});
