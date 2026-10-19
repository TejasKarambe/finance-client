# 💎 ApexFinance Client

An ultra-modern, enterprise-grade Personal Finance Management web application built with **TanStack Start (React 19 + TypeScript + Vite + Nitro Engine)**, **TanStack Router**, **TanStack Query (React Query v5)**, and **Tailwind CSS v4**.

ApexFinance delivers a responsive, sleek, glassmorphic financial command center designed for precision money management—featuring real-time cash flow dashboards, multi-account ledger tracking, atomic inter-account transfers, category budgeting with automated threshold alerts, recurring transaction scheduling, savings goal milestones, AI spending insights, and global multi-currency conversion.

---

## 🛠️ Tech Stack & Architecture

* **Core Framework**: [TanStack Start](https://tanstack.com/start) (Full-stack SSR React 19 framework powered by Vite & Nitro)
* **Type-Safe Routing**: [TanStack Router](https://tanstack.com/router) with automatic file-based route generation (`src/routes/*`)
* **State Management & Caching**: [TanStack Query v5](https://tanstack.com/query) with intelligent stale-time caching and background revalidation
* **Styling & Design System**: [Tailwind CSS v4](https://tailwindcss.com/) with custom Glassmorphism dark mode palette (`#070e11`, `#0a1418`, `#4fb8b2`, `#8de5db`)
* **UI Components & Icons**: [Material UI (@mui/material)](https://mui.com/), `@mui/x-date-pickers`, and [Lucide React](https://lucide.dev/)
* **HTTP Client**: [Axios](https://axios-http.com/) configured with JWT Bearer token request interceptors and automatic 401 redirect handling
* **Code Quality & Tooling**: [Biome](https://biomejs.dev/) for sub-millisecond linting and code formatting
* **Deployment Target**: [Vercel](https://vercel.com/) (Serverless Edge Functions) / Node.js runtime

---

## ✨ Features & Application Modules

### 1. 📊 Executive Dashboard (`/`)
* **Live KPI Cards**: Real-time aggregation of **Total Net Worth / Balance**, **Monthly Income**, **Monthly Expenses**, and **Net Cash Flow**.
* **Time Period Filters**: Toggle dynamically between `All Time`, `This Month`, and `Last Month`.
* **Cash Flow Trajectory Chart**: 6-month historical visual comparison of income vs. expenses.
* **Category Spending Distribution**: Interactive category breakdown chart with percentage shares.
* **🧠 AI Financial Health Card**:
  - Financial Health Score (0–100) with dynamic letter grades (`A+` to `F`).
  - Key financial vital signs: Monthly Savings Rate, Top Spending Burn, and Recurring Expense Ratio.
  - Actionable AI-generated optimization tips and anomaly alerts.
* **Recent Ledger Activity**: Quick transaction feed with instant categorization and account badges.
* **Public Landing Page**: Seamless unauthenticated welcome hero highlighting platform capabilities and quick login/registration.

### 2. 💳 Accounts Portfolio & Inter-Account Transfers (`/accounts`)
* **Multi-Account Types**: Manage `BANK`, `CASH`, `SAVINGS`, `CREDIT_CARD`, and `INVESTMENT` accounts.
* **Opening & Current Balances**: Track starting capital alongside live transactional balances.
* **⚡ Atomic Inter-Account Fund Transfers**:
  - Transfer funds directly between any two user accounts.
  - Zero balance distortion: Transfers adjust account balances atomically without inflating income or expense totals.
  - Supports optional cross-currency destination amounts.

### 3. 🧾 Transaction Ledger (`/transactions`)
* **High-Density Ledger Table**: Paginated, sortable transaction data grid.
* **Advanced Multi-Criteria Filtering**:
  - Instant text search across descriptions and categories.
  - Filter by transaction type (`INCOME`, `EXPENSE`, `TRANSFER`).
  - Filter by category, account, date range (`Start Date` / `End Date`), and monetary range (`Min` / `Max`).
* **CRUD Management**: Create, edit, and delete transactions with real-time balance reconciliation.
* **Spreadsheet CSV Bulk Import**: Drag-and-drop CSV upload with backend validation error reporting and batch ingestion.
* **Filtered CSV Export**: Download the active filtered ledger view into a CSV file.

### 4. 🎯 Category Budgeting & Threshold Alerting (`/budgets`)
* **Monthly Spending Allocations**: Set category caps per month and year.
* **Visual Progress Meters**: Live calculation of spent vs. remaining allowance.
* **3-Tier Status Indicators**:
  - 🟢 **NORMAL**: Under 80% of budget limit.
  - 🟡 **WARNING**: Between 80% and 99.9% of budget limit.
  - 🔴 **EXCEEDED**: 100% or more of budget limit spent.

### 5. 🔄 Recurring Transactions & Subscriptions (`/recurring`)
* **Automated Schedule Tracking**: Manage subscriptions (Netflix, Spotify), utility bills, rent, and salaries.
* **Flexible Frequencies**: `DAILY`, `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`.
* **Due Date Tracking**: Dynamic calculation of next due dates and "Days Until Due" badges.
* **Execution Engine**:
  - Manually post an individual recurring transaction to the ledger on demand.
  - One-click **"Process All Due Now"** batch posting.

### 6. 🏆 Milestone Savings Goals (`/goals`)
* **Target-Driven Milestones**: Set savings goals with deadlines, target amounts, custom color badges, and icons.
* **Progress Percentage Indicators**: Circular and bar visualizations tracking progress toward completion.
* **Direct Account Contributions**: Transfer money from any linked account directly into a goal—automatically deducting account balance and updating goal progress.

### 7. 📈 Financial Reports & Backup (`/reports`)
* **Monthly Cash Flow Statement**: Net income, total expenses, savings rate, and category breakdowns.
* **Annual Financial Summary**: 12-month trajectory curves and top annual expense drivers.
* **Complete JSON Backup**: One-click download of the user's entire financial portfolio (`apex_finance_backup_YYYY-MM-DD.json`), including accounts, transactions, budgets, recurring rules, and savings goals.
* **Financial Ledger CSV Download**: Direct export of historical ledger records.

### 8. 🌍 Global Multi-Currency Engine
* Built-in dynamic currency switcher supporting 10+ world currencies:
  - `INR (₹)`, `USD ($)`, `EUR (€)`, `GBP (£)`, `CAD (CA$)`, `AUD (AU$)`, `JPY (¥)`, `AED (د.إ)`, `CHF (CHF)`, `CNY (¥)`, `BRL (R$)`.
* Converts and formats every balance, transaction amount, and metric dynamically with localized currency symbols.

### 9. 🔔 Dynamic In-App Notifications
* Central notification drawer displaying real-time alerts:
  - Budget threshold warnings (80% and 100% caps).
  - Upcoming due bills and subscriptions.
  - Account balance notices.
* One-click dismiss individual alerts or clear all notifications.

### 10. 🔐 Authentication & Session Security (`/login`, `/register`)
* User registration and login with form validation.
* Secure JWT storage in `localStorage`.
* Automatic request authorization via Axios request interceptor.
* Seamless session expiration handling with automatic login redirect.

---

## 📂 Project Architecture & File Structure

```
finance-client/
├── package.json                        # Dependencies, scripts & metadata
├── vite.config.ts                      # Vite configuration & TanStack plugins
├── tsconfig.json                       # TypeScript compiler options
├── biome.json                          # Biome linter & formatter rules
├── vercel.json                         # Vercel serverless deployment config
├── .env.example                        # Template environment variables
├── .env.local                          # Local environment variables
└── src/
    ├── routes/                         # TanStack Router file-based routes
    │   ├── __root.tsx                  # Root layout, theme, auth, & navbar wrapper
    │   ├── index.tsx                   # Dashboard overview & landing page
    │   ├── accounts.tsx                # Account management & inter-account transfers
    │   ├── transactions.tsx            # Transaction ledger, filters, & CSV import/export
    │   ├── budgets.tsx                 # Category budgets & threshold monitors
    │   ├── recurring.tsx               # Recurring transaction scheduler & batch processor
    │   ├── goals.tsx                   # Savings goals & account contributions
    │   ├── reports.tsx                 # Financial reports, charts, & full JSON backup
    │   ├── login.tsx                   # User login authentication
    │   └── register.tsx                # User registration
    ├── components/
    │   ├── layout/
    │   │   └── AppNavbar.tsx           # Sticky glassmorphism header, nav links & notifications
    │   └── currency/
    │       └── CurrencySelector.tsx    # Currency switcher dropdown modal
    ├── lib/
    │   ├── api.ts                      # Axios client, TypeScript interfaces & REST API methods
    │   ├── auth-context.tsx            # React authentication state provider
    │   ├── currency-context.tsx        # Multi-currency state & exchange rate converter
    │   ├── theme-context.tsx           # Dark/light theme mode context
    │   ├── mui-provider.tsx            # Material UI dark theme configuration
    │   └── utils.ts                    # Classnames & styling helpers
    ├── routeTree.gen.ts                # Auto-generated TanStack route tree
    ├── router.tsx                      # Router instance initialization
    └── styles.css                      # Tailwind CSS v4 directives & glassmorphic utilities
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in `finance-client/` (refer to `.env.example`):

```bash
# Backend REST API Base URL (must end with /api)
VITE_API_URL=http://localhost:8080/api
```

### Production Deployment (e.g. Vercel)
In your Vercel project settings under **Settings > Environment Variables**, set:
```bash
VITE_API_URL=https://your-backend-service.onrender.com/api
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or newer (v20+ recommended)
* **npm** or **pnpm** installed
* Running backend service (ApexFinance Spring Boot API at `http://localhost:8080`)

### Installation
1. **Navigate to the frontend directory**:
   ```bash
   cd finance-client
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| **Development** | `npm run dev` | Starts the Vite dev server on `http://localhost:3000` with `.env.local` |
| **Route Generation** | `npm run generate-routes` | Re-generates `routeTree.gen.ts` from files in `src/routes/` |
| **Production Build** | `npm run build` | Compiles client and server bundles for production |
| **Preview** | `npm run preview` | Locally previews the compiled production build |
| **Start Server** | `npm run start` | Runs the compiled Nitro server from `.output/` |
| **Format** | `npm run format` | Formats all source files with Biome |
| **Lint** | `npm run lint` | Runs the Biome linter |
| **Check** | `npm run check` | Runs formatting and lint verification together |

---

## 🚢 Production Deployment to Vercel

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. In the [Vercel Dashboard](https://vercel.com/), select **Add New > Project** and import your repository.
3. Set the **Root Directory** to `finance-client`.
4. Ensure framework preset is detected as **TanStack Start** (or Other with `npm run build`).
5. Add the environment variable:
   - `VITE_API_URL` = `https://your-backend-api.onrender.com/api`
6. Click **Deploy**. Vercel will build the Vite assets and deploy the Nitro SSR engine to Vercel Serverless Functions.

---

## 🤝 Backend API Integration

The frontend client communicates seamlessly with the Spring Boot backend service. All requests automatically:
- Append `Authorization: Bearer <token>` from `localStorage` (`finance_token`).
- Catch `401 Unauthorized` responses and route unauthenticated users to `/login`.
- Extract human-readable error messages from standard Spring Boot `ErrorResponse` and `ValidationErrorResponse` records.
