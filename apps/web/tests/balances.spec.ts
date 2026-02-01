import { test, expect } from '@playwright/test';

test.describe('Balances Feature', () => {
    test.describe.configure({ mode: 'serial' });

    test('should correctly calculate and display balances', async ({ page }) => {
        // 1. Setup Users
        const userAEmail = `balance-a-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
        const userBEmail = `balance-b-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
        const userAName = 'User A';
        const userBName = 'User B';

        // Signup User B (so they exist in DB)
        await page.goto('/auth/signup');
        await page.fill('input[name="name"]', userBName);
        await page.fill('input[name="email"]', userBEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);
        await page.click('button:has-text("Sign out")'); // Logout

        // Signup/Login User A
        await page.goto('/auth/signup');
        await page.fill('input[name="name"]', userAName);
        await page.fill('input[name="email"]', userAEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);

        // 2. Create Group (as User A)
        await page.click('text=Create New Group');
        const groupName = 'Balance Test Group';
        await page.fill('input[name="name"]', groupName);
        await page.click('button:has-text("Create Group")');

        // 3. Add User B to Group
        await page.click(`text=${groupName}`);
        await page.click('button:has-text("Add Member")');
        await page.fill('input[name="email"]', userBEmail);
        await page.click('button:has-text("Add Member")'); // Inside modal
        // Verify Modal Closed and maybe success message or just proceed
        await expect(page.getByText('Add New Member')).not.toBeVisible();

        // 4. Create Expense (User A pays $100)
        // Default split is Equal (50/50)
        await page.click('button:has-text("Add Expense")');
        await page.fill('input[name="description"]', 'Dinner');
        await page.fill('input[name="amount"]', '100');
        await page.click('button:has-text("Add Expense")'); // Submit

        // 5. Verify Balances
        // User A paid 100. Share is 50. Net +50.
        // User B paid 0. Share is 50. Net -50.
        // Expected Debt: User B owes User A $50.00

        // Wait for balances to load/update
        await expect(page.getByText(`${userBName} owes ${userAName}`)).toBeVisible();
        await expect(page.getByText('$50.00')).toBeVisible();
    });
});
