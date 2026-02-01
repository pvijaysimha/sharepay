import { test, expect } from '@playwright/test';

test.describe('Dashboard Access', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('should allow authenticated users to view dashboard', async ({ page }) => {
        // 1. Sign up (or login) to get the cookie
        const uniqueEmail = `dashboard-test-${Date.now()}@example.com`;
        await page.goto('/auth/signup');
        await page.fill('input[name="name"]', 'Dashboard User');
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // 2. Verify redirection to dashboard
        await expect(page).toHaveURL(/\/dashboard/);

        // 3. Verify Dashboard Content
        await expect(page.locator('h3')).toContainText('Welcome back, Dashboard User!');

        // 4. Verify Cookie is present (optional, implicit by access)
        // const cookies = await page.context().cookies();
        // const tokenCookie = cookies.find(c => c.name === 'token');
        // expect(tokenCookie).toBeTruthy();
    });

    test('should logout successfully', async ({ page }) => {
        // 1. Login/Signup
        const uniqueEmail = `logout-test-${Date.now()}@example.com`;
        await page.goto('/auth/signup');
        await page.fill('input[name="name"]', 'Logout User');
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);

        // 2. Click Logout
        await page.click('text=Sign out');

        // 3. Verify redirection to login
        await expect(page).toHaveURL(/\/auth\/login/);

        // 4. Verify cannot access dashboard anymore
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/auth\/login/);
    });
});
