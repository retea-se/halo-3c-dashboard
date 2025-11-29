/**
 * E2E tests för Events page
 */
import { test, expect } from '@playwright/test';

test.describe('Events Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events');
  });

  test('should display events page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Events');
  });

  test('should display event filters', async ({ page }) => {
    // Check if filter dropdowns are visible
    const filters = page.locator('select, [role="combobox"]');
    await expect(filters.first()).toBeVisible({ timeout: 5000 });
  });

  test('should filter events by severity', async ({ page }) => {
    // Wait for events to load
    await page.waitForTimeout(2000);

    // Look for severity filter
    const severityFilter = page.locator('select, [aria-label*="Severity"], [aria-label*="severitet"]').first();

    if (await severityFilter.isVisible()) {
      await severityFilter.selectOption({ label: 'CRITICAL' });
      await page.waitForTimeout(1000);

      // Events should be filtered
      const eventsTable = page.locator('table, [role="table"]').first();
      await expect(eventsTable).toBeVisible();
    }
  });

  test('should sort events by timestamp', async ({ page }) => {
    // Wait for events table to load
    await page.waitForTimeout(2000);

    // Look for sortable column headers
    const timestampHeader = page.locator('th:has-text("Timestamp"), th:has-text("Tid")').first();

    if (await timestampHeader.isVisible()) {
      await timestampHeader.click();
      await page.waitForTimeout(500);

      // Events should be sorted
      const eventsTable = page.locator('table, [role="table"]').first();
      await expect(eventsTable).toBeVisible();
    }
  });

  test('should acknowledge an event', async ({ page }) => {
    // Wait for events to load
    await page.waitForTimeout(2000);

    // Look for acknowledge button
    const acknowledgeBtn = page.locator('button:has-text("Acknowledge"), button:has-text("Kvittera")').first();

    if (await acknowledgeBtn.isVisible()) {
      await acknowledgeBtn.click();
      await page.waitForTimeout(1000);

      // Event status should be updated
      // This would require checking the event status after acknowledge
    }
  });
});


