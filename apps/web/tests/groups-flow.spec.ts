import { test, expect } from '@playwright/test';

test.describe('Groups Flow', () => {
    test('should allow a user to create a new group', async ({ page }) => {
        // 1. Signup/Login (Reuse flow or direct login)
        // Using Signup to ensure fresh state
        const uniqueEmail = `group-test-${Date.now()}@example.com`;
        await page.goto('/auth/signup');
        await page.fill('input[name="name"]', 'Group Creator');
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Verify we are on dashboard
        await expect(page).toHaveURL(/\/dashboard/);
        // await expect(page).toHaveTitle(/SharePay/); // Removed: Title not guaranteed yet
        // Or check for a specific dashboard element
        await expect(page.getByText('Welcome back, Group Creator!')).toBeVisible();

        // 2. Open Create Group Modal
        await page.click('text=Create New Group');

        // 3. Fill Modal
        const groupName = 'Summer Trip 2024';
        await page.fill('input[name="name"]', groupName);
        await page.selectOption('select[name="currency"]', 'USD');

        // 4. Submit
        await page.click('button:has-text("Create Group")');

        // 5. Verify Modal Closes and Group Appears
        // Wait for modal to disappear (optional, usually implied if we can click something else)
        // Check if group is in the list
        await expect(page.getByText(groupName)).toBeVisible();
    });
});
