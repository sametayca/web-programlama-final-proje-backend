# Payment Integration Guide (Internal Wallet)

## Overview
The system implements a closed-loop wallet system for campus payments (Meals, Events).

## Architecture
- **Transactions Table:** Records all credits (deposits) and debits (purchases).
- **Atomic Operations:** Balance updates are performed using database transactions to prevent race conditions.

## Transaction Logic
1. **Check Balance:** `SELECT balance FROM users WHERE id = ?`
2. **Verify Sufficiency:** `if (balance < amount) throw Error('Insufficient funds')`
3. **Deduct:** `UPDATE users SET balance = balance - amount`
4. **Record Log:** `INSERT INTO transactions (userId, amount, type) VALUES (...)`

## Future External Integration
- **Iyzico/Stripe:** Webhooks will be set up to listen for top-up confirmations and trigger the credit logic above.
