/**
 * E2E tests för Dashboard page
 */
import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dashboard title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should display sensor cards', async ({ page }) => {
    // Wait for sensor data to load
    await page.waitForSelector('[data-testid="sensor-card"], .sensor-card', { timeout: 10000 });

    // Check if at least one sensor card is visible
    const sensorCards = page.locator('[data-testid="sensor-card"], .sensor-card').first();
    await expect(sensorCards).toBeVisible();
  });

  test('should display beacon list section', async ({ page }) => {
    const beaconSection = page.locator('text=BLE Beacons').first();
    await expect(beaconSection).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    // Find theme toggle button
    const themeToggle = page.locator('[aria-label*="tema"], [aria-label*="theme"]').first();

    if (await themeToggle.isVisible()) {
      // Get initial theme (check background color)
      const initialBg = await page.locator('body').evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );

      // Click theme toggle
      await themeToggle.click();

      // Wait for theme change
      await page.waitForTimeout(500);

      // Check if background color changed
      const newBg = await page.locator('body').evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );

      expect(newBg).not.toBe(initialBg);
    }
  });

  test('should navigate to events page', async ({ page }) => {
    // Click on Events link in navbar
    const eventsLink = page.locator('nav a:has-text("Events")').first();
    await eventsLink.click();

    // Should navigate to events page
    await expect(page).toHaveURL(/\/events/);
    await expect(page.locator('h1')).toContainText('Events');
  });

  test('should navigate to sensor info page', async ({ page }) => {
    // Click on Sensor Info link in navbar
    const sensorInfoLink = page.locator('nav a:has-text("Sensor Info")').first();
    await sensorInfoLink.click();

    // Should navigate to sensor info page
    await expect(page).toHaveURL(/\/sensors\/info/);
  });
});


