/**
 * Visual regression tests för light/dark mode
 */
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('should match dashboard screenshot in light mode', async ({ page }) => {
    await page.goto('/');

    // Ensure light mode is active
    const themeToggle = page.locator('[aria-label*="mörkt"], [aria-label*="dark"]').first();
    if (await themeToggle.isVisible()) {
      // Already in light mode, or toggle to light
      const currentTheme = await page.evaluate(() =>
        document.documentElement.style.getPropertyValue('--color-background')
      );

      // If dark, toggle to light
      if (!currentTheme || currentTheme.includes('1a1d21')) {
        await themeToggle.click();
        await page.waitForTimeout(500);
      }
    }

    await page.waitForTimeout(1000); // Wait for content to load

    await expect(page).toHaveScreenshot('dashboard-light.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
  });

  test('should match dashboard screenshot in dark mode', async ({ page }) => {
    await page.goto('/');

    // Toggle to dark mode
    const themeToggle = page.locator('[aria-label*="mörkt"], [aria-label*="dark"]').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);
    }

    await page.waitForTimeout(1000); // Wait for theme to apply

    await expect(page).toHaveScreenshot('dashboard-dark.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
  });

  test('should match events page screenshot', async ({ page }) => {
    await page.goto('/events');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('events-page.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
  });

  test('should match sensor info page screenshot', async ({ page }) => {
    await page.goto('/sensors/info');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('sensor-info-overview.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
  });
});


