# Token Launch Pad

A decentralized platform for launching and managing tokens on the Solana blockchain. Built with Next.js, TypeScript, and the Solana Web3.js SDK.

## Features

- Token Creation and Management
- User-friendly Token Minting Interface
- Wallet Integration (Phantom, Solflare, and other Solana wallets)
- Solana Devnet Support
- Token Metadata Management
- Real-time Token Balance Display
- Transaction History
- Modern, Responsive UI with Shadcn/UI

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Solana compatible wallet (Phantom recommended)
- Helius API Key (for RPC access)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/RaghavenderSingh/token-launch-pad.git
cd token-launch-pad
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with the following variables:
```env
NEXT_PUBLIC_RPC_URL=https://devnet.helius-rpc.com/?api-key=your-api-key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
token-launch-pad/
├── app/                    # Next.js app router pages
│   ├── page.tsx            # Main landing page
│   ├── layout.tsx          # Root layout component
│   ├── create-tokens/      # Token creation page
│   └── my-tokens/          # Token management page
├── components/             # Reusable React components
│   ├── ui/                 # Shadcn UI components
│   ├── create-token-form/  # Token creation form components
│   ├── my-tokens/          # Token listing and management components
│   ├── transactions/       # Transaction-related components
│   └── wallet/             # Wallet connection components
├── lib/                    # Utility functions and configurations
│   ├── solana/             # Solana-specific utilities
│   ├── utils.ts            # General utility functions
│   └── constants.ts        # Application constants
├── public/                 # Static assets
```

## Implementation Details

### Wallet Integration
- Uses `@solana/wallet-adapter-react` for wallet management
- Supports multiple Solana wallets including Phantom and Solflare
- Smooth wallet connection flow with proper error handling
- Secure transaction signing

### Token Creation
- Implements Solana SPL Token program for token creation
- Configurable token supply, decimals, and metadata
- User-friendly form with validation
- Clear feedback on transaction success or failure

### Token Management
- View all tokens created by the connected wallet
- Display token details including supply, decimals, and mint address
- Visual representation of token icons
- Transaction history for each token

## Future Enhancements

- Token transfer functionality
- Advanced token metadata with images
- Token analytics dashboard
- Social sharing for created tokens
- Multi-chain support
- Token locking and vesting schedules

## Development

### Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Solana Web3.js
- @solana/wallet-adapter
- Tailwind CSS
- Shadcn/UI components

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

Created by Raghavender Singh

## ⭐ Found This Helpful? Show Some Love! ⭐


