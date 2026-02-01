import { test, expect } from '@playwright/test';

test('should display receipt scanning option in add expense modal', async ({ page, browser }) => {
    // 1. Setup User
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const userAEmail = `scanner${Date.now()}@test.com`;
    const userAName = 'Scanner Pro';

    await pageA.goto('http://localhost:3000/auth/signup');
    await pageA.fill('input[name="name"]', userAName);
    await pageA.fill('input[name="email"]', userAEmail);
    await pageA.fill('input[name="password"]', 'password123');
    await pageA.click('button[type="submit"]');

    // 2. Create Group
    await pageA.click('button:has-text("Create New Group")');
    await pageA.fill('input[name="name"]', 'Scanning Group');
    await pageA.click('button:has-text("Create Group")');

    // Go to group
    await pageA.click('text=Scanning Group');

    // 3. Open Add Expense
    await pageA.click('button:has-text("Add Expense")');

    // 4. Verify Receipt Scanner UI
    await expect(pageA.getByText('Scan Receipt (Optional)')).toBeVisible();
    await expect(pageA.getByText('Click to upload')).toBeVisible();

    // Note: We are not testing actual OCR functionality here as it depends on external WASM/Worker loading
    // and image processing which is better tested manually or with mocked workers.
});
