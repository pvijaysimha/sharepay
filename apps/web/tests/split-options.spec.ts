import { test, expect } from '@playwright/test';

test('should correctly handle full amount split in check balances', async ({ page, browser }) => {
    // 1. Setup User A (Admin/Payer)
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const userAEmail = `alice${Date.now()}@test.com`;
    const userAName = 'Alice Owner';

    await pageA.goto('http://localhost:3000/auth/signup');
    await pageA.fill('input[name="name"]', userAName);
    await pageA.fill('input[name="email"]', userAEmail);
    await pageA.fill('input[name="password"]', 'password123');
    await pageA.click('button[type="submit"]');

    // 2. Setup User B (Debtor)
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const userBEmail = `bob${Date.now()}@test.com`;
    const userBName = 'Bob Debtor';

    await pageB.goto('http://localhost:3000/auth/signup');
    await pageB.fill('input[name="name"]', userBName);
    await pageB.fill('input[name="email"]', userBEmail);
    await pageB.fill('input[name="password"]', 'password123');
    await pageB.click('button[type="submit"]');

    // 3. User A Creates Group
    await pageA.bringToFront();
    await pageA.click('button:has-text("Create New Group")');
    await pageA.fill('input[name="name"]', 'Split Test Group');
    await pageA.click('button:has-text("Create Group")');

    // Go to group
    await pageA.click('text=Split Test Group');

    // Add User B
    await pageA.click('button:has-text("Add Member")');
    await pageA.fill('input[name="email"]', userBEmail);
    await pageA.click('button:has-text("Add Member")', { force: true });

    // Wait for modal to close
    await expect(pageA.getByRole('dialog')).not.toBeVisible();

    // Reload to ensure list update
    await pageA.reload();
    await expect(pageA.getByText(userBName)).toBeVisible({ timeout: 10000 });

    // 4. Add Expense: Full Amount by Bob
    await pageA.click('button:has-text("Add Expense")');
    await pageA.fill('input[name="description"]', 'Full Debt');
    await pageA.fill('input[name="amount"]', '100');

    // Select "One person owes everything"
    await pageA.click('label:has-text("One person owes everything")');

    // Select Bob as debtor
    await pageA.selectOption('select#debtor', { label: userBName });

    // Submit
    await pageA.click('button:has-text("Add Expense")');

    // 5. Verify Balances
    // Alice paid 100. Bob owes 100.
    // Balances should show: "Bob Debtor owes Alice Owner" $100.00
    // Look for the specific text in the Balances list
    // Use loose matching for "owes" to avoid exact whitespace issues in text content
    await expect(pageA.getByText(`${userBName} owes ${userAName}`)).toBeVisible();
    await expect(pageA.getByText('$100.00')).toBeVisible();

});
