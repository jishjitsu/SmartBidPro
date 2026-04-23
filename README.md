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
├── package.json          # Node dependencies
├── contracts/             # Solidity Smart Contracts (Foundry)
│   ├── src/
│   │   └── TenderNotary.sol
│   └── foundry.toml
├── fabric/                # Hyperledger Fabric Go Chaincode (In Progress)
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
Actix_PORT=8000
Actix_ADDRESS=0.0.0.0
ETH_NOTARY_CONTRACT_ADDRESS=your-notary-contract-address
ETH_PRIVATE_KEY=your-ethereum-private-key
```

3. Build and run the backend:
```bash
cargo build
cargo run
```

The Actix server will start on `http://localhost:8000`
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

### Blockchain Setup (Ethereum Notary)
The project uses a Hybrid Web2.5 architecture. You must deploy the TenderNotary contract to a local Ethereum node to enable the public audit trail.

1. Start a Local Node
In a separate terminal, start the Anvil development chain (included with Foundry):

```Bash
anvil
```

Keep this running. It provides the RPC endpoint and 10 pre-funded test accounts.

2. Deploy the Notary Contract
Navigate to the contracts/ directory and run the deployment command. Replace <PRIVATE_KEY> with the first private key provided by Anvil (usually starts with 0xac09...).

```Bash
cd contracts
forge create src/TenderNotary.sol:TenderNotary \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <PRIVATE_KEY> \
  --broadcast
```

3. Update Environment Variables
Once deployed, the terminal will output a Deployed to: address. Copy this value and update your backend/.env:

```env
ETH_NOTARY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3  # Replace with your actual address
ETH_RPC_URL=http://127.0.0.1:8545
ETH_PRIVATE_KEY=<YOUR_ANVIL_PRIVATE_KEY>
```
The Next.js app will start on `http://localhost:3000`

## Development

To make changes:

1. **Backend**: Edit files in `backend/src/`, rebuild with `cargo build`
2. **Frontend**: Edit files in `app/` or `components/`, changes hot-reload automatically
3. **Populating Users**: Run /scripts/create-test-user.js using node to seed users into your database
