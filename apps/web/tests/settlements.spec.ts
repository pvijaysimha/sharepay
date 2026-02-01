import { test, expect } from '@playwright/test';

test.describe('Settlements Feature', () => {
    test.describe.configure({ mode: 'serial' });

    test('should allow users to settle debts', async ({ page }) => {
        // 1. Setup Users
        const userAEmail = `settle-a-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
        const userBEmail = `settle-b-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
        const userAName = 'User A';
        const userBName = 'User B';

        // Signup User B
        await page.goto('/auth/signup');
        await page.fill('input[name="name"]', userBName);
        await page.fill('input[name="email"]', userBEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);
        await page.click('button:has-text("Sign out")');

        // Signup/Login User A
        await page.goto('/auth/signup');
        await page.fill('input[name="name"]', userAName);
        await page.fill('input[name="email"]', userAEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);

        // 2. Create Group (as User A)
        await page.click('text=Create New Group');
        const groupName = 'Settlement Test Group';
        await page.fill('input[name="name"]', groupName);
        await page.click('button:has-text("Create Group")');

        // 3. Add User B to Group
        await page.click(`text=${groupName}`);
        await page.click('button:has-text("Add Member")');
        await page.fill('input[name="email"]', userBEmail);
        await page.click('button:has-text("Add Member")');
        await expect(page.getByText('Add New Member')).not.toBeVisible();

        // 4. Create Debt (User A pays $100)
        // User B owes $50
        await page.click('button:has-text("Add Expense")');
        await page.fill('input[name="description"]', 'Dinner');
        await page.fill('input[name="amount"]', '100');
        await page.click('button:has-text("Add Expense")');
        await expect(page.getByText(`${userBName} owes ${userAName}`)).toBeVisible();
        await expect(page.getByText('$50.00')).toBeVisible();

        // 5. User B logs in to Settle
        await page.click('button:has-text("Sign out")');

        await page.fill('input[name="email"]', userBEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]'); // Login
        await expect(page).toHaveURL(/\/dashboard/);

        // Navigate to group
        // Note: Dashboard links might need refresh or wait. The list shows groups I'm member of.
        // Since B was added, he should see it.
        await expect(page.getByText(groupName)).toBeVisible();
        await page.click(`text=${groupName}`);

        // Verify Debt from B's perspective
        // "User B owes User A"
        await expect(page.getByText(`${userBName} owes ${userAName}`)).toBeVisible();

        // Should see "Settle" button because B is the one who owes
        await expect(page.getByRole('button', { name: 'Settle' })).toBeVisible();

        // 6. Click Settle
        await page.click('button:has-text("Settle")');
        await expect(page.getByText('Settle Up')).toBeVisible();
        await expect(page.getByText(`Paying ${userAName}`)).toBeVisible();
        // Amount should be pre-filled with 50.00
        // We can just click Pay
        await page.click('button:has-text("Pay")');

        // 7. Verify Settlement
        // Modal closes
        await expect(page.getByText('Settle Up')).not.toBeVisible();
        // Balances update
        // Should show "No outstanding balances" or empty list
        await expect(page.getByText('No outstanding balances')).toBeVisible();

        // Also check Expense List for "Settlement" entry
        await expect(page.getByText('Settlement', { exact: true })).toBeVisible();
    });
});
