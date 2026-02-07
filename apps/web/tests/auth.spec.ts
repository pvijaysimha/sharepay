import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    // Use timestamp to ensure unique email for each test run
    const testId = Date.now();

    test('should show signup page correctly', async ({ page }) => {
        await page.goto('/auth/signup');
        await expect(page).toHaveTitle(/SharePay/);
        await expect(page.locator('h2')).toContainText('Create your account');
        await expect(page.locator('input[id="name"]')).toBeVisible();
        await expect(page.locator('input[id="email-address"]')).toBeVisible();
        await expect(page.locator('input[id="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show login page correctly', async ({ page }) => {
        await page.goto('/auth/login');
        await expect(page).toHaveTitle(/SharePay/);
        await expect(page.locator('h2')).toContainText('Sign in to your account');
        await expect(page.locator('input[id="email-address"]')).toBeVisible();
        await expect(page.locator('input[id="password"]')).toBeVisible();
        await expect(page.locator('a[href="/auth/forgot-password"]')).toBeVisible();
    });

    test('should show forgot password page correctly', async ({ page }) => {
        await page.goto('/auth/forgot-password');
        await expect(page).toHaveTitle(/SharePay/);
        await expect(page.locator('h2')).toContainText('Forgot your password?');
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should signup successfully and show verification message', async ({ page }) => {
        const uniqueEmail = `test-signup-${testId}@example.com`;

        await page.goto('/auth/signup');

        // Fill out signup form
        await page.fill('input[id="name"]', 'Test User');
        await page.fill('input[id="email-address"]', uniqueEmail);
        await page.fill('input[id="password"]', 'password123');

        // Submit signup
        await page.click('button[type="submit"]');

        // Should show verification message OR redirect to dashboard
        // Wait for either the success message or dashboard URL
        await Promise.race([
            expect(page.getByText('Check your email')).toBeVisible({ timeout: 10000 }),
            expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
        ]);
    });

    test('should show error for duplicate email signup', async ({ page }) => {
        // First signup
        const duplicateEmail = `test-dup-${testId}@example.com`;
        await page.goto('/auth/signup');
        await page.fill('input[id="name"]', 'Test User');
        await page.fill('input[id="email-address"]', duplicateEmail);
        await page.fill('input[id="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Wait for signup to complete
        await page.waitForTimeout(2000);

        // Go back to signup and try again with same email
        await page.goto('/auth/signup');
        await page.fill('input[id="name"]', 'Test User 2');
        await page.fill('input[id="email-address"]', duplicateEmail);
        await page.fill('input[id="password"]', 'password456');
        await page.click('button[type="submit"]');

        // Should show error about existing user
        await expect(page.getByText(/already exists/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/auth/login');
        await page.fill('input[id="email-address"]', 'nonexistent-user@example.com');
        await page.fill('input[id="password"]', 'wrongpassword123');
        await page.click('button[type="submit"]');

        // Should show error message
        await expect(page.getByText(/Invalid credentials|verify your email/i)).toBeVisible({ timeout: 5000 });
    });

    test('should navigate from login to forgot password', async ({ page }) => {
        await page.goto('/auth/login');
        await page.click('a[href="/auth/forgot-password"]');
        await expect(page).toHaveURL(/forgot-password/);
        await expect(page.locator('h2')).toContainText('Forgot your password?');
    });

    test('should submit forgot password request', async ({ page }) => {
        await page.goto('/auth/forgot-password');
        await page.fill('input[type="email"]', 'test@example.com');
        await page.click('button[type="submit"]');

        // Should show success message (check your email)
        await expect(page.getByText(/check your email|sent/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show error for missing reset token', async ({ page }) => {
        await page.goto('/auth/reset-password');

        // Should show invalid reset link message
        await expect(page.getByText(/Invalid Reset Link/i)).toBeVisible();
    });

    test('should show error for invalid reset token', async ({ page }) => {
        // Navigate to reset password with invalid token
        await page.goto('/auth/reset-password?token=invalidtoken123');

        // Try to reset password
        await page.fill('input[id="password"]', 'newpassword123');
        await page.fill('input[id="confirmPassword"]', 'newpassword123');
        await page.click('button[type="submit"]');

        // Should show error about invalid/expired token
        await expect(page.getByText(/Invalid|expired/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show password mismatch error on reset', async ({ page }) => {
        await page.goto('/auth/reset-password?token=sometoken');
        await page.fill('input[id="password"]', 'password123');
        await page.fill('input[id="confirmPassword"]', 'differentpassword');
        await page.click('button[type="submit"]');

        await expect(page.getByText(/do not match/i)).toBeVisible();
    });

    test('should navigate from signup to login', async ({ page }) => {
        await page.goto('/auth/signup');
        await page.click('a[href="/auth/login"]');
        await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('should navigate from login to signup', async ({ page }) => {
        await page.goto('/auth/login');
        await page.click('a[href="/auth/signup"]');
        await expect(page).toHaveURL(/\/auth\/signup/);
    });
});
