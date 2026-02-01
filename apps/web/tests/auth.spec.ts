import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should allow a user to sign up and then log in', async ({ page }) => {
        // 1. Navigate to Signup Page
        await page.goto('/auth/signup');
        await expect(page).toHaveTitle(/Create Next App/); // Adjusted based on layout metadata

        // 2. Fill out Signup Form
        const uniqueEmail = `test-${Date.now()}@example.com`;
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', 'password123');

        // 3. Submit Signup
        await page.click('button[type="submit"]');

        // 4. Verify Redirection to Dashboard
        await expect(page).toHaveURL(/\/dashboard/);

        // 5. (Skip Login steps as we are already logged in)
        // Verify we can access dashboard features or logout

        /* 
           Original test flow was Signup -> Login. 
           Since Signup now logs in automatically, we can verify Dashboard access directly.
           For completeness of "Login" testing, we should Logout then Login.
        */

        // Logout
        await page.click('text=Sign out');
        await expect(page).toHaveURL(/\/auth\/login/);

        // 5. Fill out Login Form
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', 'password123');

        // 6. Submit Login
        await page.click('button[type="submit"]');

        // 7. Verify Redirection to Dashboard (or successful login state)
        // Note: We haven't implemented /dashboard yet, so this might fail if not handled, 
        // but the login logic currently redirects to /dashboard.
        // We expect a 404 on /dashboard but the URL change proves logic worked.
        await expect(page).toHaveURL(/\/dashboard/);
    });
});
