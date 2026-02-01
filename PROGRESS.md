# SharePay Progress & Roadmap

## Current Status
**Phase:** Initial Implementation & Verification
**Last Updated:** 2026-01-27

### Active Tasks
- [x] Verify Login Flow
- [x] Verify Logout Flow
- [x] Verify Full Auth Flow (Signup -> Login -> Logout)
- [x] Implement Groups UI (Dashboard)

## Completed Tasks
### Authentication
- [x] User Signup Backend (API Route)
- [x] User Signup Frontend (Page)
- [x] Auth Utilities (Password hashing, JWT signing/verification)

### Groups
- [x] Groups API (GET /api/groups - List groups)
- [x] Groups API (POST /api/groups - Create group)

## Roadmap

### Phase 1: Core Foundation (Current)
- [x] **Authentication**: Complete and verify all auth flows.
- [x] **Groups**: Basic group management (Create, List, View details).
- [x] **Dashboard**: persistent layout and navigation.

### Phase 2: Expense Management
- [x] **Expenses API**: CRUD operations for expenses.
- [x] **Expense UI**: Forms to add expenses, split logic.
- [x] **Balances**: Calculation logic to show who owes whom.
- [ ] **Receipt Scanning**: Upload receipts and auto-fill expense details (Mindee). (Deferred)

### Phase 3: Settlements
- [x] **Settlement API**: Record payments (e.g., "I paid you back").
- [x] **Settlement UI**: Button to settle debts in the Balances view.and "Settle Up" functionality.

### Phase 4: Polish & Advanced Features
- [ ] **Notifications**: Email or in-app notifications for new expenses/groups.
- [ ] **Activity Feed**: History of recent actions in a group.
- [ ] **Mobile Responsiveness**: Ensure all views work well on mobile.
