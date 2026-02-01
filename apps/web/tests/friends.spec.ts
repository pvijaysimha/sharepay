import { test, expect } from '@playwright/test';

test('should add friend and create direct expense', async ({ page, browser }) => {
    // 1. Setup User A (Alice)
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    pageA.on('dialog', async dialog => {
        console.log(`[User A Alert]: ${dialog.message()}`);
        await dialog.dismiss();
    });

    const userAEmail = `alice${Date.now()}@test.com`;
    const userAName = 'Alice User';

    await pageA.goto('http://localhost:3000/auth/signup');
    await pageA.fill('input[name="name"]', userAName);
    await pageA.fill('input[name="email"]', userAEmail);
    await pageA.fill('input[name="password"]', 'password123');
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL('http://localhost:3000/dashboard');

    // 2. Setup User B (Bob) - In separate context
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const userBEmail = `bob${Date.now()}@test.com`;
    const userBName = 'Bob User';

    await pageB.goto('http://localhost:3000/auth/signup');
    await pageB.fill('input[name="name"]', userBName);
    await pageB.fill('input[name="email"]', userBEmail);
    await pageB.fill('input[name="password"]', 'password123');
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL('http://localhost:3000/dashboard');

    // 3. User A Adds User B as Friend
    await pageA.bringToFront();
    // Open Modal
    await pageA.click('button:has-text("Add Friend")');
    await expect(pageA.getByRole('dialog')).toBeVisible();

    await pageA.fill('input[name="email"]', userBEmail);
    // Submit Form
    await pageA.click('form button[type="submit"]');

    // Wait for modal to close
    await expect(pageA.getByRole('dialog')).not.toBeVisible();

    // Verify Friend List
    await expect(pageA.getByText(userBName)).toBeVisible();

    // 4. User A Adds Direct Expense with User B
    // Find the list item containing Bob's name
    const bobRow = pageA.getByRole('listitem').filter({ hasText: userBName });
    await expect(bobRow).toBeVisible();
    await bobRow.getByRole('button', { name: 'Add Expense' }).click({ force: true });
    // Wait for modal
    await expect(pageA.getByText('Add New Expense')).toBeVisible();

    await pageA.fill('input[name="description"]', 'Lunch together');
    await pageA.fill('input[name="amount"]', '40');
    // Payer defaults to User A
    await pageA.click('button:has-text("Add Expense")'); // Submit

    // 5. Verify Expense Logic (Since we don't have global expense list yet, check if UI is happy)
    // Actually, where do we display direct expenses?
    // We haven't built a "Global Expenses" list yet! The user asked to "add" expenses.
    // But they probably want to see them too.
    // The current Dashboard only lists groups.
    // We integrated FriendsList, but not "Expenses List".
    // I should create a "Recent Activity" or "All Expenses" list or "Debt Summary" on Dashboard.
    // Currently `BalancesList` is inside `GroupDetails`.

    // For now, let's just verify the *creation* via API success by checking if modal closes or toast appears?
    // The modal closes on success.
    await expect(pageA.getByText('Add New Expense')).not.toBeVisible();

    // 6. Check User B's side (Friend visible)
    await pageB.reload();
    await expect(pageB.getByText(userAName)).toBeVisible(); // Bidirectional friendship

});
