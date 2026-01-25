# Invest Portfolio Tracker

A comprehensive stock portfolio tracking application designed for the Colombo Stock Exchange (CSE). This application allows investors to track their holdings, monitor market performance in real-time, and analyze their investment portfolio with advanced features like compliance rules and historical analytics.

## 🚀 Features

- **Real-time Market Data**: Live integration with CSE API to fetch ASPI, S&P SL20 indices, and individual stock prices.
- **Portfolio Management**: Track multiple stock holdings with automatic calculation of average buy price, total invested, and current value.
- **Transaction History**: Record all Buy, Sell, and Dividend transactions with detailed fee tracking.
- **Advanced Analytics**: Visual analytics for portfolio performance, sector allocation, and historical trends.
- **Trading Rules Engine**: Set and monitor innovative trading rules like Stop-Loss and Take-Profit thresholds active on your portfolio.
- **Demo & Simulation**: Built-in demo mode and stock price simulation tools for testing strategies.
- **Responsive Design**: Modern, mobile-first UI built with Tailwind CSS and Shadcn UI.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Neon Serverless](https://neon.tech/))
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
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
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint.
- `npm run db:generate`: Generates Drizzle migrations based on schema changes.
- `npm run db:push`: Pushes schema changes directly to the database.
- `npm run db:studio`: Opens Drizzle Studio to inspect the database.

## 📂 Project Structure

```
├── src
│   ├── app             # Next.js App Router pages and API routes
│   │   ├── api         # Backend API endpoints (CSE, Auth, Portfolio)
│   │   └── ...         # Frontend pages (Dashboard, Transactions, etc.)
│   ├── components      # Reusable React components
│   │   ├── ui          # Shadcn UI primitives
│   │   └── layout      # Layout components like Sidebar
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

The `src/lib/cse-api.ts` module handles all communications with the Colombo Stock Exchange API, providing a typed interface for market data retrieval.

## 🌍 Deployment Strategy

This project leverages a modern, edge-first deployment strategy using **Cloudflare Pages** combined with the `opennextjs-cloudflare` adapter.

- **Edge Computing**: Unlike traditional server-based deployments, this app runs on Cloudflare's global edge network. This ensures minimum latency by serving the application logic from the data center closest to the user.
- **OpenNext**: Bridges the gap between Next.js App Router features and the Cloudflare Workers runtime, allowing us to use modern Next.js 15+ features (like Server Actions and Streaming) in a serverless edge environment.
- **CI/CD Pipeline**: The build command `npm run build:pages` transforms the standard Next.js build into a worker-compatible artifact.

## 🔌 Database Architecture (Neon)

The persistence layer is built on **Neon**, a modern serverless PostgreSQL platform that aligns perfectly with the project's cloud-native architecture.

- **Serverless PostgreSQL**: Neon separates storage from compute. This allows the database to scale to zero when unused (saving costs) and instantly provision compute resources during traffic spikes.
- **Connection Management**: Since the application runs in a serverless environment (Cloudflare Workers), maintaining persistent database connections is impossible. We use the `@neondatabase/serverless` driver over HTTP/WebSockets to manage ephemeral connections efficiently.
- **Type Safety**: Integration with **Drizzle ORM** provides end-to-end type safety. The database schema is defined in TypeScript (`src/db/schema.ts`), ensuring that any changes to the data model are instantly reflected in the application code, eliminating a common class of runtime errors.
