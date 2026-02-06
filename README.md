# SmartBid-PRO

A revolutionary technology aimed to digitise the hassle of tenders through analog means. 

SBP achieves this using a secure smart contract based backend, and an AI validation model which comprehensively checks for compliance of a Certain tender, and regulations to be followed.

Built using Next.js and Rocket(Rust)

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **shadcn/ui** - Beautiful, accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe development

### Backend
- **Rocket (Rust)** - Fast, secure web framework
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

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token

### Auctions
- `GET /api/auctions` - Get all auctions (requires auth)
- `GET /api/auctions/<id>` - Get auction by ID (requires auth)
- `POST /api/auctions` - Create new auction (requires auth)
- `PUT /api/auctions/<id>` - Update auction (requires auth, admin or creator)
- `DELETE /api/auctions/<id>` - Delete auction (requires auth, admin or creator)

## Features Implemented

✅ Rust backend with Rocket framework
✅ MongoDB database integration
✅ JWT-based authentication
✅ Role-based access control (Admin/Bidder/Auctioneer)
✅ CRUD operations for auctions
✅ Next.js frontend with shadcn/ui
✅ Login page with authentication
✅ Dashboard to view auctions
✅ Responsive design with dark mode support

## Next Steps

- [ ] Implement auction creation form
- [ ] Add bid submission functionality
- [ ] Integrate IPFS for document storage
- [ ] Add Polygon smart contracts integration
- [ ] Implement FastAPI AI compliance service
- [ ] Add real-time bidding with WebSockets
- [ ] Implement audit logs
- [ ] Add compliance scoring dashboard

## Development

To make changes:

1. **Backend**: Edit files in `backend/src/`, rebuild with `cargo build`
2. **Frontend**: Edit files in `app/` or `components/`, changes hot-reload automatically

## License

MIT
