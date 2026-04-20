# SmartBid-PRO

A revolutionary technology aimed to digitise the hassle of tenders through analog means. 

SBP achieves this using a secure smart contract based backend, and an AI validation model which comprehensively checks for compliance of a Certain tender, and regulations to be followed.

Built using Next.js and Actix Web

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **shadcn/ui** - Beautiful, accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe development

### Backend
- **Actix Web (Rust)** - Fast, secure web framework
- **MongoDB** - NoSQL database for flexible data storage
- **JWT Authentication** - Secure token-based auth
- **bcrypt** - Password hashing

## Project Structure

```
smartbidpro/
├── app/                    # Next.js pages
│   ├── login/             # Login page
│   ├── dashboard/         # Dashboard page
│   └── page.tsx           # Home page (redirects)
├── components/ui/         # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   └── input.tsx
├── lib/                   # Utility functions
│   └── utils.ts
├── backend/               # Rust backend
│   ├── src/
│   │   ├── main.rs       # Entry point
│   │   ├── auth.rs       # JWT authentication
│   │   ├── db.rs         # MongoDB connection
│   │   ├── models.rs     # Data models
│   │   └── routes/       # API endpoints
│   │       ├── auth.rs   # Auth routes
│   │       └── auctions.rs # Auction CRUD
│   └── Cargo.toml        # Rust dependencies
└── package.json          # Node dependencies
```

## Getting Started

### Prerequisites
- Node.js 20+ installed
- Rust toolchain installed
- MongoDB running locally or connection URI

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a `.env` file with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/smartbidpro
JWT_SECRET=your-secret-key-change-this-in-production
ROCKET_PORT=8000
ROCKET_ADDRESS=0.0.0.0
```

3. Build and run the backend:
```bash
cargo build
cargo run
```

The Rocket server will start on `http://localhost:8000`
z
### Frontend Setup

1. Navigate to the project root:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The Next.js app will start on `http://localhost:3000`

## Development

To make changes:

1. **Backend**: Edit files in `backend/src/`, rebuild with `cargo build`
2. **Frontend**: Edit files in `app/` or `components/`, changes hot-reload automatically
3. **Populating Users**: Run /scripts/create-test-user.js using node to seed users into your database
