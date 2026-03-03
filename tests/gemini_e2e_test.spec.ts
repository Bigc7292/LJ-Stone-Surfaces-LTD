import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * End-to-End Test for Gemini Surgical Edits & Veo Video Generation
 * This test uses the provided kitchen image to verify the entire pipeline.
 */
test('verify surgical countertop edit and video generation', async ({ page }) => {
    // 1. Navigate to the local dev server (defaulting to PORT 3010 as per package.json)
    await page.goto('http://localhost:3010');

    // 2. Upload the provided test image (kitchen_test.jpg)
    const imagePath = path.resolve('sample_kitchen.jpg'); // Using the high-res one if available
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('#upload-kitchen-btn'); // Replace with actual ID from UI
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(imagePath);

    // 3. Select a stone material (e.g., Carrara Marble)
    await page.click('text=Carrara Marble'); // Selective by text or ID

    // 4. Trigger the 'Surgical Edit' visualization
    await page.click('#generate-viz-btn');

    // 5. Assert: Static image edit is successful and displayed
    // We expect a Cloudinary URL to be returned and rendered in an <img> tag
    const editedImage = page.locator('#edited-room-image');
    await expect(editedImage).toBeVisible({ timeout: 60000 });
    const editedImageUrl = await editedImage.getAttribute('src');
    console.log('Static edited image generated:', editedImageUrl);
    expect(editedImageUrl).toContain('cloudinary.com');

    // 6. Assert: Video stage starts and produces dual videos
    // The UI should show loading states for the videos
    const clockwiseVideo = page.locator('#clockwise-walkthrough-video');
    const counterClockwiseVideo = page.locator('#counter-clockwise-walkthrough-video');

    // Wait for both videos to be ready (Google Veo takes ~30-60s)
    await expect(clockwiseVideo).toBeVisible({ timeout: 120000 });
    await expect(counterClockwiseVideo).toBeVisible({ timeout: 120000 });

    const v1Url = await clockwiseVideo.getAttribute('src');
    const v2Url = await counterClockwiseVideo.getAttribute('src');

    console.log('Clockwise video:', v1Url);
    console.log('Counter-clockwise video:', v2Url);

    expect(v1Url).toContain('cloudinary.com');
    expect(v2Url).toContain('cloudinary.com');

    // 7. Visual Confirmation: Take a screenshot of the results
    await page.screenshot({ path: 'verification_results_full.png', fullPage: true });
});
