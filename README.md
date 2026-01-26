# Invest Portfolio Tracker

A comprehensive stock portfolio tracking application designed for the Colombo Stock Exchange (CSE). This application allows investors to track their holdings, monitor market performance in real-time, and analyze their investment portfolio with advanced features like compliance rules and historical analytics.

![Demo Preview](./demo.png)

## 🚀 Features

- **Real-time Market Data**: Live integration with CSE API to fetch ASPI, S&P SL20 indices, and individual stock prices.
- **Portfolio Management**:
  - Track multiple stock holdings with automatic calculation of average buy price, total invested, and current value.
  - **Capital Allocation Calculator**: Built-in tool to help calculate position sizes based on percentage of total capital.
  - **Active vs Inactive**: Filter between current holdings and sold positions.
- **Advanced Stock Analysis**:
  - **TradingView Integration**: Professional-grade interactive charts, technical indicators, and financial statements (Income Statement, Balance Sheet, Cash Flow).
  - **Key Statistics**: Deep dive into company performance with advanced metrics.
- **Transaction History**:
  - Record all Buy, Sell, and Dividend transactions with detailed fee tracking.
  - **CSV Export**: Export your entire transaction history for external analysis.
- **Trading Rules Engine**: A unique compliance system designed to mitigate emotional decision-making. Configure and monitor rules for Cash Buffers, Position Sizing, Stop-Loss/Take-Profit limits, and Trade Frequency.
- **Guest Mode & Simulation**: Try the platform without an account using the Guest Mode, featuring a fully functional portfolio simulator.
- **Security & Performance**:
  - Enterprise-grade security with rate limiting, IP protection, and IDOR prevention.
  - Edge-optimized for lightning-fast performance.
- **Responsive Design**: Modern, mobile-first UI optimized for Desktop, Tablet, and Mobile devices.
- **Feedback System**: Integrated user feedback collection system with automated email notifications.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Neon Serverless](https://neon.tech/))
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/) & [TradingView Widgets](https://www.tradingview.com/widget/)
- **Email**: [Resend](https://resend.com/)
- **Deployment**: Configured for Cloudflare via OpenNext

## 📦 Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- A PostgreSQL database (Neon recommended)

## ⚡ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/invest-portfolio-tracker.git
cd invest-portfolio-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory and add your database connection string:

```env
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"
RESEND_API_KEY="re_..."
```

### 4. Database Setup

Push the schema to your database:

```bash
npm run db:push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Scripts

- `npm run dev`: Starts the development server using Turbopack.
- `npm run build`: Builds the application for production.
- `npm run build:pages`: Builds the application for Cloudflare Pages (OpenNext).
- `npm run lint`: Runs ESLint.
- `npm run db:generate`: Generates Drizzle migrations based on schema changes.
- `npm run db:push`: Pushes schema changes directly to the database.
- `npm run db:studio`: Opens Drizzle Studio to inspect the database.

## 📂 Project Structure

```
├── src
│   ├── app             # Next.js App Router pages and API routes
│   │   ├── api         # Backend API endpoints (CSE, Auth, Portfolio)
│   │   ├── portfolio   # Portfolio & Stock Details pages
│   │   ├── transactions # Transaction history & management
│   │   └── market      # Market overview & explorer
│   ├── components      # Reusable React components
│   │   ├── ui          # Shadcn UI primitives
│   │   ├── layout      # Layout components like Sidebar
│   │   └── tradingview-* # TradingView widget wrappers
│   ├── db              # Database configuration and schema
│   │   ├── schema.ts   # Drizzle ORM schema definitions
│   │   └── migrations  # SQL migration files
│   └── lib             # Core logic and utilities
│       ├── cse-api.ts  # CSE API integration
│       ├── rule-engine # Trading compliance logic
│       └── ...
└── ...
```

## 🏗️ Architecture Highlights

### Data Model

The application uses a relational schema with the following key entities:

- **Stocks**: Global master list of CSE stocks.
- **Holdings**: User-specific current positions.
- **Transactions**: Ledger of all buy/sell/dividend events.
- **Trading Rules**: User-defined compliance parameters.

### External Integration

- **CSE API**: The `src/lib/cse-api.ts` module handles all communications with the Colombo Stock Exchange API.
- **TradingView**: Embedded widgets provide world-class charting and financial data visualization without heavy backend storage requirements.

### Feedback & Notifications

The feedback system uses a dual-write approach:

1.  **Persistence**: Feedback is stored in the `feedback` table in Neon/Postgres for record-keeping.
2.  **Notification**: A serverless function triggers an email via **Resend** to the administrator immediately upon submission.

## 🔒 Security Measures

Based on a recent security audit, the application implements a robust security baseline:

- **Authentication**:
  - **Rate Limiting**: Strict IP-based rate limiting (5 attempts/15 mins) on login endpoints to prevent brute-force attacks.
  - **Session Security**: JWT-based sessions stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies to mitigate XSS and CSRF risks.
  - **Constant-Time Comparison**: Crypto-safe comparison logic for password verification to prevent timing attacks.

- **Data Protection**:
  - **SQL Injection**: Complete neutralizing of SQL injection vectors through Drizzle ORM's parameterized queries.
  - **Data Isolation**: Strict middleware-level authorization limits all database queries to the authenticated user's scope. Guest users are cryptographically isolated from Admin data.
  - **Input Validation**: Comprehensive runtime validation using `zod` ensures data integrity before it reaches the core logic.

- **Guest Mode Safety**:
  - **Resource Quotas**: Implementation of strict resource limits (transaction/holding counts) for Guest users to prevent database resource exhaustion.

## 🌍 Deployment Strategy

This project leverages a modern, edge-first deployment strategy using **Cloudflare Pages** combined with the `opennextjs-cloudflare` adapter.

- **Edge Computing**: Unlike traditional server-based deployments, this app runs on Cloudflare's global edge network. This ensures minimum latency by serving the application logic from the data center closest to the user.
- **OpenNext**: Bridges the gap between Next.js App Router features and the Cloudflare Workers runtime, allowing us to use modern Next.js 16+ features in a serverless edge environment.
- **CI/CD Pipeline**: The build command `npm run build:pages` transforms the standard Next.js build into a worker-compatible artifact.

## 🔌 Database Architecture (Neon)

The persistence layer is built on **Neon**, a modern serverless PostgreSQL platform that aligns perfectly with the project's cloud-native architecture.

- **Serverless PostgreSQL**: Neon separates storage from compute. This allows the database to scale to zero when unused (saving costs) and instantly provision compute resources during traffic spikes.
- **Connection Management**: Since the application runs in a serverless environment (Cloudflare Workers), maintaining persistent database connections is impossible. We use the `@neondatabase/serverless` driver over HTTP/WebSockets to manage ephemeral connections efficiently.
- **Type Safety**: Integration with **Drizzle ORM** provides end-to-end type safety. The database schema is defined in TypeScript (`src/db/schema.ts`), ensuring that any changes to the data model are instantly reflected in the application code.
