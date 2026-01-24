# CSE Portfolio Tracker

A personal stock portfolio tracker for the **Colombo Stock Exchange (CSE)** with real-time market data integration, transaction management, analytics, and psychological trading rule enforcement.

![Application Demo](./demo.webp)

## Features

### 📊 Portfolio Management

- Track your CSE stock holdings with live price updates
- View current portfolio value, total P/L, and individual stock performance
- Add, edit, and remove stocks from your portfolio
- Automatic average buy price calculation

### 💸 Transaction History

- Log BUY, SELL, and DIVIDEND transactions
- Automatic holdings update on transaction entry
- Filter and search transaction history
- Export transaction data

### 🛡️ Trading Rules Engine

- Set personal discipline rules to avoid psychological trading traps
- Position size limits (max % per stock)
- Stop-loss alerts
- Take-profit reminders
- Sector allocation limits
- Trade frequency controls
- Real-time violation warnings

### 📈 Analytics & Insights

- Portfolio performance over time
- Sector allocation breakdown
- Benchmark comparison against ASI (All Share Price Index)
- Top performers and underperformers
- Monthly and YTD returns

### 🌐 CSE Market Integration

- Real-time stock prices from CSE API
- Market status (Open/Closed)
- ASI and S&P SL20 indices
- Company information and logos

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Drizzle ORM
- **Data Fetching:** TanStack Query (React Query)
- **Charts:** Recharts
- **Containerization:** Docker & Docker Compose
- **CSE Data:** [CSE API](https://www.cse.lk/api/)

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (recommended)
- PostgreSQL (if not using Docker)

### Quick Start with Docker

```bash
# Clone the repository
cd /Users/lxnid/Documents/invest-portfolio-tracker

# Start the application with Docker Compose
docker compose up

# Access the application
open http://localhost:3000
```

### Development Setup (without Docker)

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your PostgreSQL connection string

# Push database schema
npm run db:push

# Start development server
npm run dev
```

## Available Scripts

| Command               | Description                             |
| --------------------- | --------------------------------------- |
| `npm run dev`         | Start development server with Turbopack |
| `npm run build`       | Build for production                    |
| `npm run start`       | Start production server                 |
| `npm run db:generate` | Generate Drizzle migrations             |
| `npm run db:push`     | Push schema to database                 |
| `npm run db:studio`   | Open Drizzle Studio (database GUI)      |

## Project Structure

```
invest-portfolio-tracker/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── holdings/     # Portfolio CRUD
│   │   │   ├── transactions/ # Transaction management
│   │   │   ├── rules/        # Trading rules
│   │   │   └── cse/          # CSE market data proxy
│   │   ├── portfolio/        # Portfolio page
│   │   ├── transactions/     # Transactions page
│   │   ├── rules/            # Trading rules page
│   │   ├── analytics/        # Analytics page
│   │   └── page.tsx          # Dashboard
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   └── layout/           # Layout components
│   ├── db/
│   │   ├── schema.ts         # Database schema
│   │   └── index.ts          # Database client
│   └── lib/
│       ├── cse-api.ts        # CSE API integration
│       └── utils.ts          # Utility functions
├── docker-compose.yml        # Docker Compose configuration
├── Dockerfile                # Production Docker image
└── drizzle.config.ts         # Drizzle ORM configuration
```

## Database Schema

The application uses a single-portfolio design optimized for personal use:

- **stocks** - CSE stock information (symbol, name, sector)
- **holdings** - Current portfolio positions
- **transactions** - Complete trade history (BUY/SELL/DIVIDEND)
- **trading_rules** - Personal discipline rules with flexible JSON conditions

## API Endpoints

| Endpoint                  | Method           | Description                             |
| ------------------------- | ---------------- | --------------------------------------- |
| `/api/holdings`           | GET              | Get all holdings                        |
| `/api/holdings`           | POST             | Add new holding                         |
| `/api/holdings/[id]`      | GET, PUT, DELETE | Manage single holding                   |
| `/api/transactions`       | GET              | Get transaction history                 |
| `/api/transactions`       | POST             | Add transaction (auto-updates holdings) |
| `/api/rules`              | GET, POST        | Manage trading rules                    |
| `/api/cse/market`         | GET              | Get market status, ASI, stock prices    |
| `/api/cse/stock/[symbol]` | GET              | Get individual stock data               |

## Deployment

### Production Build

```bash
# Build Docker image
docker build -t cse-portfolio-tracker .

# Run production container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  cse-portfolio-tracker
```

### Subdomain Setup (dinilr.com)

1. **DNS Configuration:**
   - Create A record: `portfolio.dinilr.com` → `<your-server-ip>`
   - Or CNAME if using a proxy/CDN

2. **Reverse Proxy (Nginx):**

   ```nginx
   server {
       listen 80;
       server_name portfolio.dinilr.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **SSL with Let's Encrypt:**
   ```bash
   certbot --nginx -d portfolio.dinilr.com
   ```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT

## Acknowledgments

- [CSE API](https://gh0sth4cker.github.io/Colombo-Stock-Exchange-CSE-API-Documentation/) for providing market data
- Built with [Next.js](https://nextjs.org/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
