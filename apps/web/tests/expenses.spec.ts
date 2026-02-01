import { test, expect } from '@playwright/test';

test.describe('Expense Tracking', () => {
    test('should allow a user to add an expense to a group', async ({ page }) => {
        // 1. Sign up/Login
        const uniqueEmail = `expense-test-${Date.now()}@example.com`;
        await page.goto('/auth/signup');
        await page.fill('input[name="name"]', 'Expense User');
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);

        // 2. Create a Group
        await page.click('text=Groups');
        await page.click('text=Create Group');
        await page.fill('input[name="name"]', 'Expense Group');
        await page.click('button[type="submit"]');
        await expect(page.locator('table')).toContainText('Expense Group');

        // 3. Navigate to Group Details
        await page.click('tr:has-text("Expense Group") >> text=View');
        await expect(page).toHaveURL(/\/dashboard\/groups\/.+/);

        // 4. Add Expense
        await page.click('text=Add Expense');
        await page.fill('input[name="description"]', 'Team Lunch');
        await page.fill('input[name="amount"]', '120.00');
        // Payer should default to us, so we can just submit 
        await page.click('button:has-text("Add Expense")');

        // 5. Verify Expense in List
        await expect(page.locator('text=Team Lunch')).toBeVisible();
        await expect(page.locator('text=120.00')).toBeVisible();
        await expect(page.locator('text=Paid by Expense User')).toBeVisible();
    });
});
