import { test, expect } from '@playwright/test';

test.describe('Expense UI Flow', () => {
    test.describe.configure({ mode: 'serial' });

    test('should allow a user to create an expense via UI', async ({ page }) => {
        // 1. Signup/Login
        const uniqueEmail = `expense-ui-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
        await page.goto('/auth/signup');
        await page.fill('input[name="name"]', 'UI Tester');
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);

        // 2. Create a Group first
        await page.click('text=Create New Group');
        const groupName = 'UI Test Group';
        await page.fill('input[name="name"]', groupName);
        await page.click('button:has-text("Create Group")');

        // 3. Navigate to Group Details
        // Wait for group to appear and click it
        await expect(page.getByText(groupName)).toBeVisible();
        await page.click(`text=${groupName}`);

        // Verify we are on details page
        await expect(page).toHaveURL(/\/dashboard\/groups\//);
        await expect(page.getByText(groupName)).toBeVisible();
        await expect(page.getByText('Add Expense')).toBeVisible();

        // 4. Add Expense
        await page.click('text=Add Expense');
        await expect(page.getByText('Add New Expense')).toBeVisible();

        const expenseParams = {
            description: 'Team Lunch',
            amount: '50.00'
        };
        await page.fill('input[name="description"]', expenseParams.description);
        await page.fill('input[name="amount"]', expenseParams.amount);
        // Date defaults to today

        await page.click('button:has-text("Add Expense")');

        // 5. Verify Expense in List
        // Modal should close
        await expect(page.getByText('Add New Expense')).not.toBeVisible();
        // Expense should appear
        await expect(page.getByText(expenseParams.description)).toBeVisible();
        // Check amount display (allowing for currency symbol)
        await expect(page.getByText('50.00')).toBeVisible();
    });
});
