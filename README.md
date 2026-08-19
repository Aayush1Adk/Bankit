# Bankit Lite

**Bankit Lite** is a backend-focused digital banking and ledger system built with **Node.js, Express.js, and MongoDB**.

The project simulates core banking operations such as user authentication, account management, balance calculation, money transfers, transaction tracking, system-funded accounts, and email notifications.

It was built as a backend engineering project to explore **JWT authentication, MongoDB transactions, double-entry-style ledger records, idempotency, role-based access control, and secure financial state management**.

> **Project Status:** Learning / Portfolio Project
> **Backend:** Node.js + Express.js
> **Database:** MongoDB + Mongoose

---

## Features

### Authentication & Authorization

* User registration and login
* Password hashing using `bcryptjs`
* JWT-based authentication
* JWT stored in HTTP-only cookies
* Authorization using Bearer tokens as an alternative
* Token blacklist for logout/revocation
* Separate authorization middleware for system users
* Password excluded from normal database queries

### Account Management

* Create bank accounts for authenticated users
* Retrieve all accounts belonging to the current user
* Retrieve an individual account balance
* Account status management structure:

  * `active`
  * `frozen`
  * `closed`
* Account currency field
* Indexed account queries

### Ledger-Based Balance System

Bankit Lite does not store the current balance directly on the account document.

Instead, the balance is calculated from immutable ledger entries:

```text
Balance = Total Credits - Total Debits
```

Each ledger entry contains:

* Account
* Amount
* Transaction
* Type (`CREDIT` / `DEBIT`)

Ledger entries are designed to be **immutable**, preventing updates or deletion after creation.

### Money Transfers

Authenticated users can transfer funds between accounts.

The transaction flow includes:

1. Validate the transaction request
2. Verify both accounts exist
3. Check transaction idempotency
4. Verify both accounts are active
5. Calculate the sender's balance from the ledger
6. Check for sufficient funds
7. Create a transaction record
8. Create a debit ledger entry
9. Create a credit ledger entry
10. Mark the transaction as completed

Supported transaction states:

```text
PENDING
COMPLETED
FAILED
REVERSED
```

### Idempotency

Transactions require an `idempotencyKey`.

This is intended to prevent the same transaction request from being processed multiple times when a client retries a request.

For example:

```text
POST /api/transaction
idempotencyKey: "transfer-12345"
```

If the same key is submitted again, the system checks the existing transaction instead of blindly creating another one.

### System User & Initial Funds

Bankit Lite supports a special `systemUser` role.

System users can use:

```text
POST /api/transaction/initial-funds
```

to create an initial-funding transaction for another account.

This separates normal user transfers from system-controlled fund allocation.

### Email Notifications

Email notifications are implemented using **Nodemailer** with Gmail OAuth2.

Notifications are currently supported for:

* Registration
* Login
* Successful transaction

---

## Architecture

The backend follows a layered Express architecture:

```text
Backend
│
├── server.js
│
└── src
    ├── app.js
    │
    ├── config
    │   └── db.js
    │
    ├── controllers
    │   ├── accountController.js
    │   ├── authController.js
    │   └── transactionController.js
    │
    ├── middleware
    │   └── authMiddleware.js
    │
    ├── models
    │   ├── account.model.js
    │   ├── blackList.model.js
    │   ├── ledger.model.js
    │   ├── transaction.model.js
    │   └── user.model.js
    │
    ├── routes
    │   ├── account.routes.js
    │   ├── auth.routes.js
    │   └── transaction.routes.js
    │
    └── services
        └── email.service.js
```

### Request Flow

```text
Client
  │
  ▼
Express Router
  │
  ▼
Authentication Middleware
  │
  ▼
Controller
  │
  ├── User Model
  ├── Account Model
  ├── Transaction Model
  └── Ledger Model
          │
          ▼
       MongoDB
```

---

## Data Model

The main entities are:

```text
User
 │
 └── Account
       │
       └── Ledger Entries
              │
              └── Transaction
```

### User

Stores:

* Name
* Email
* Hashed password
* System-user flag
* Timestamps

### Account

Stores:

* User reference
* Account status
* Currency
* Timestamps

The account does not directly store a mutable balance.

### Transaction

Stores:

* Source account
* Destination account
* Amount
* Transaction status
* Idempotency key
* Timestamps

### Ledger

Stores:

* Account
* Amount
* Transaction reference
* Entry type

Ledger entries are immutable.

---

## API Endpoints

### Authentication

| Method | Endpoint             | Authentication | Description                |
| ------ | -------------------- | -------------- | -------------------------- |
| `POST` | `/api/auth/register` | No             | Register a new user        |
| `POST` | `/api/auth/login`    | No             | Login user                 |
| `POST` | `/api/auth/logout`   | No             | Logout and blacklist token |

### Accounts

| Method | Endpoint                               | Authentication | Description         |
| ------ | -------------------------------------- | -------------- | ------------------- |
| `POST` | `/api/account/create-account`          | User           | Create an account   |
| `GET`  | `/api/account/get-accounts`            | User           | Get user's accounts |
| `GET`  | `/api/account/get-accounts/:accountId` | User           | Get account balance |

### Transactions

| Method | Endpoint                         | Authentication | Description          |
| ------ | -------------------------------- | -------------- | -------------------- |
| `POST` | `/api/transaction`               | User           | Transfer funds       |
| `POST` | `/api/transaction/initial-funds` | System User    | Fund another account |

---

## Example Transaction

A transfer request can look like:

```json
{
  "fromAccount": "SOURCE_ACCOUNT_ID",
  "toAccount": "DESTINATION_ACCOUNT_ID",
  "amount": 1000,
  "idempotencyKey": "transfer-unique-001"
}
```

The system creates two ledger entries:

```text
Source Account
    │
    └── DEBIT 1000

Destination Account
    │
    └── CREDIT 1000
```

The resulting balances are calculated from these ledger records.

---

## Authentication

Bankit Lite uses JWT for authentication.

After login or registration, a JWT is issued containing the user's identity:

```text
JWT
 │
 └── userId
```

The authentication middleware:

1. Reads the token from the cookie or `Authorization` header
2. Checks whether the token has been blacklisted
3. Verifies the JWT signature
4. Retrieves the user from MongoDB
5. Attaches the user to `req.user`

Protected routes can then access:

```js
req.user
```

---

## Token Revocation

Logout is implemented using a token blacklist.

When a user logs out:

```text
JWT
 │
 ▼
TokenBlacklist Collection
 │
 ▼
Cookie Removed
```

The blacklist collection uses a MongoDB TTL index so old blacklisted tokens are automatically removed after approximately **3 days**, matching the JWT expiration period.

---

## Environment Variables

Create a `.env` file inside the `Backend` directory.

Example:

```env
PORT=3000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email@gmail.com
CLIENT_ID=your_google_oauth_client_id
CLIENT_SECRET=your_google_oauth_client_secret
REFRESH_TOKEN=your_google_oauth_refresh_token
```

Do not commit `.env` to GitHub.

The repository already ignores `.env` files through `.gitignore`.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/bankit-lite.git
```

### 2. Enter the backend directory

```bash
cd bankit-lite/Backend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create:

```text
Backend/.env
```

and add the required environment variables.

### 5. Start the development server

```bash
npm run dev
```

The server runs on:

```text
http://localhost:3000
```

### 6. Start in production mode

```bash
npm start
```

---

## Technologies Used

| Technology        | Purpose             |
| ----------------- | ------------------- |
| **Node.js**       | JavaScript runtime  |
| **Express.js**    | REST API framework  |
| **MongoDB**       | Database            |
| **Mongoose**      | MongoDB ODM         |
| **JWT**           | Authentication      |
| **bcryptjs**      | Password hashing    |
| **Cookie Parser** | Cookie handling     |
| **Nodemailer**    | Email notifications |
| **Nodemon**       | Development server  |

---

## Security Concepts Implemented

The project explores several backend security concepts:

* Password hashing
* JWT authentication
* HTTP cookies
* Authorization middleware
* System-user authorization
* Token revocation
* Token expiration
* MongoDB indexes
* Input validation through Mongoose schemas
* Immutable ledger entries
* Idempotency keys
* Balance validation before transfers

---

## Important Design Concept: Ledger-Based Accounting

A key design decision in Bankit Lite is avoiding a mutable:

```text
balance
```

field on the account.

Instead, balances are derived from transaction history.

For example:

```text
Ledger

Account A
DEBIT   500
CREDIT 1000
DEBIT   200

Balance = 1000 - 500 - 200
        = 300
```

This provides a transaction history from which the balance can be reconstructed.

This approach is particularly useful for understanding how financial systems can maintain an auditable record of account movements.

## Learning Objectives

This project was built to gain practical experience with:

* REST API development
* Express.js architecture
* MongoDB and Mongoose
* JWT authentication
* Role-based authorization
* Password hashing
* Database transactions
* Ledger-based accounting
* Idempotency
* Database indexing
* Immutable records
* Email integration
* Backend error handling

---

## License

This project is currently released under the **ISC License**.

---

## Disclaimer

Bankit Lite is a portfolio/educational project designed to demonstrate backend engineering concepts.

It is **not intended to process real financial transactions or replace a regulated banking system**.
