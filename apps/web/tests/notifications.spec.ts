import { test, expect } from '@playwright/test';

test('should create notification when adding member to group', async ({ page, browser }) => {
    // 1. Create two users
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const userAEmail = `notif_sender_${Date.now()}@test.com`;
    await pageA.goto('http://localhost:3000/auth/signup');
    await pageA.fill('input[name="name"]', 'Sender');
    await pageA.fill('input[name="email"]', userAEmail);
    await pageA.fill('input[name="password"]', 'password123');
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL('**/dashboard');

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const userBEmail = `notif_receiver_${Date.now()}@test.com`;
    await pageB.goto('http://localhost:3000/auth/signup');
    await pageB.fill('input[name="name"]', 'Receiver');
    await pageB.fill('input[name="email"]', userBEmail);
    await pageB.fill('input[name="password"]', 'password123');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL('**/dashboard');

    // User B gets their ID or we just rely on UI
    // We will check User B's bell later.

    // 2. User A creates group and adds User B
    await pageA.bringToFront();
    await pageA.click('button:has-text("Create New Group")');
    await pageA.fill('input[name="name"]', 'Notification Test Group');
    await pageA.click('button:has-text("Create Group")');
    await pageA.click('text=Notification Test Group');

    await pageA.click('button:has-text("Add Member")');
    await pageA.fill('input[type="email"]', userBEmail);
    await pageA.click('button:has-text("Add")');
    await expect(pageA.getByText('User is already a member')).not.toBeVisible();
    await expect(pageA.getByText(userBEmail)).toBeVisible(); // Member list update

    // 3. User B checks notifications
    await pageB.bringToFront();
    // Refresh to fetch new notifications (or wait for poll)
    await pageB.reload();

    // Check Bell Badge (if we implemented it to show count immediately)
    // Click bell
    await pageB.click('button:has(svg)'); // The bell button

    // Check for message
    await expect(pageB.getByText('You were added to group "Notification Test Group"')).toBeVisible();
});
