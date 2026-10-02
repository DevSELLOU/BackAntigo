# Sellou Backend API

NestJS REST API for the Sellou sales force management platform.

## Overview

Sellou is a sales force automation platform that helps companies manage their sales teams, track orders, set goals, and analyze performance. This backend provides a comprehensive REST API for all platform operations.

## Features

- **Authentication & Authorization** - JWT-based auth with role-based access control
- **Order Management** - Complete order lifecycle with status workflow (OnBudget → InApproval → Approved → Invoiced → Dispatched → Delivered)
- **User/Seller Management** - User hierarchy and access control
- **Customer CRM** - Customer tracking and management
- **Dashboard & Analytics** - Real-time metrics and reporting
- **Goals & KPIs** - Sales target tracking and achievement monitoring
- **Pricing & Commissions** - Dynamic pricing rules and commission calculations
- **File Management** - S3/Wasabi integration for file uploads
- **Export** - CSV and PDF export capabilities

## Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT with Passport
- **API Documentation**: Swagger/OpenAPI
- **File Storage**: AWS S3 / Wasabi
- **Validation**: class-validator / class-transformer

## Project Structure

```
src/
├── auth/                 # Authentication & Authorization
│   ├── guards/          # JWT and Role guards
│   └── decorators/      # Custom decorators
├── companies/           # Company management
├── users/               # User/Seller management
├── user-hierarchies/   # Sales hierarchy
├── user-goals/         # Goals and KPIs
├── dashboard/           # Analytics and reporting
├── presentation/        # Business logic modules
│   ├── orders/         # Order management
│   ├── customers/      # Customer CRM
│   ├── products/       # Product catalog
│   ├── pricing/       # Pricing rules
│   └── ...
├── exports/             # CSV/PDF exports
├── uploads/            # File management
└── ...
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=sellou

# JWT
JWT_SECRET=your_secure_secret_key

# App
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3001

# File Storage
WASABI_ACCESS_KEY=your_key
WASABI_SECRET_KEY=your_secret
WASABI_BUCKET_NAME=sellou-uploads
```

## Database Migration Required

Before starting the server, run the following SQL to add the password reset expiration feature:

```sql
ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP;
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## API Documentation

Once the server is running, access Swagger documentation at:

```
http://localhost:3000/api
```

## Authentication

The API uses JWT Bearer token authentication. To access protected endpoints:

1. Login at `POST /auth/login` with email and password
2. Include the token in the Authorization header:
   ```
   Authorization: Bearer <your_token>
   ```

## User Roles

| Role | Description |
|------|-------------|
| `Administrator` | Full system access |
| `Manager` | Company management |
| `SalesRep` | Sales representative |
| `CustomerClient` | Customer user |

## Order Status Flow

```
OnBudget → InApproval → Approved → Invoiced → Dispatched → Delivered
                          ↓           ↓
                       Returned   Canceled
```

## Security Features Implemented

- Rate limiting (100 requests/15min global, 10 requests/15min for login)
- CORS restricted to configured frontend URL
- Password reset tokens expire in 15 minutes
- Company ownership validation for dashboard endpoints

## License

Proprietary - Epicora Software House
