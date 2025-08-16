# NFT Minting Integration

## Overview

The Friendsweeper game now includes NFT minting functionality that allows players to mint their game board images as **ERC-1155 NFTs** on the blockchain. This feature is available in the game over and win modals, as well as in the share result modal.

**Why ERC-1155?** Each game result has unique metadata and images, making ERC-1155 perfect for this use case. It allows for multiple token types in one contract, efficient batch operations, and flexible metadata for different game outcomes.

## Features

### 1. NFT Minting Button
- Available in game over modal, win modal, and share result modal
- Requires wallet connection
- Validates game result and board image before minting
- Shows minting status and success/error messages

### 2. NFT Metadata Generation
- Automatically generates rich metadata for each NFT
- Includes game result (Victory/Defeat)
- Contains follower count and difficulty level
- Records solving time and date
- Includes board size and game type

### 3. Cloudflare R2 Integration
- Board images are uploaded to Cloudflare R2 bucket
- Metadata JSON files are stored in Cloudflare R2 bucket
- Provides reliable, fast, and cost-effective storage for NFT assets

### 4. Marketplace & Royalty System
- Built-in marketplace for listing and buying NFTs
- 5% royalty fee automatically paid to creator on all sales
- Royalty recipient: `0xF51Fe86498b83538E902e160F2D80c34C7d6b816`
- ERC-2981 compliant royalty standard

## Implementation Details

### API Endpoint

#### `/api/mint-nft`
- Accepts game result data and user wallet address
- Validates input data
- Uploads board image to Cloudflare R2
- Generates and uploads metadata to Cloudflare R2
- Returns minting response with transaction details

#### `/api/marketplace/list-nft`
- Lists an NFT for sale on the marketplace
- Validates ownership and price
- Creates listing with timestamp

#### `/api/marketplace/buy-nft`
- Purchases an NFT from the marketplace
- Handles payment distribution (95% to seller, 5% royalty)
- Transfers NFT ownership

#### `/api/marketplace/get-listing`
- Retrieves listing information for a specific NFT
- Returns seller, price, listing status, and timestamp

### Components

#### `NFTMintButton`
- Handles wallet connection validation
- Manages minting state and UI feedback
- Integrates with the minting API
- Provides user feedback for success/error states
- Includes marketplace access after successful minting

#### `Marketplace`
- Complete marketplace interface for listing and buying NFTs
- Real-time listing information display
- Price input and validation
- Buy/sell transaction handling
- Royalty information display

#### Updated Modals
- Game Over Modal: Includes NFT minting option
- Win Modal: Includes NFT minting option
- Share Result Modal: Includes NFT minting option

### Utilities

#### `lib/nft-utils.ts`
- `uploadToCloudflare()`: Uploads data to Cloudflare R2
- `uploadToIPFS()`: Legacy function that now uses Cloudflare
- `generateNFTMetadata()`: Creates NFT metadata
- `uploadMetadataToIPFS()`: Uploads metadata to Cloudflare R2
- `validateGameResultForNFT()`: Validates game data

## Usage

### NFT Minting
1. **Play Game**: Complete a Friendsweeper game
2. **Game Over/Win**: When the game ends, the modal will show NFT minting option
3. **Connect Wallet**: Ensure your wallet is connected
4. **Mint NFT**: Click "Mint as NFT" button
5. **Confirm Transaction**: Approve the minting transaction in your wallet
6. **View NFT**: Check your wallet to see the minted NFT

### Marketplace Trading
1. **Access Marketplace**: Click "Open Marketplace" after minting
2. **List NFT**: Set a price and list your NFT for sale
3. **Buy NFT**: Browse and purchase NFTs from other players
4. **Royalty System**: 5% of all sales automatically go to the creator
5. **Track Transactions**: View all marketplace activity on BaseScan

## NFT Metadata Structure

```json
{
  "name": "Friendsweeper Victory #1234567890",
  "description": "A victorious Friendsweeper game where the player avoided all 15 followers and won!",
  "image": "https://your-bucket.r2.dev/board-images/1234567890_abc123.png",
  "external_url": "https://friendsweeper.xyz",
  "attributes": [
    {
      "trait_type": "Result",
      "value": "Victory"
    },
    {
      "trait_type": "Followers Count",
      "value": 15
    },
    {
      "trait_type": "Game Type",
      "value": "Friendsweeper"
    },
    {
      "trait_type": "Board Size",
      "value": "8x8"
    },
    {
      "trait_type": "Solving Time",
      "value": "2:30"
    },
    {
      "trait_type": "Difficulty",
      "value": "Medium"
    },
    {
      "trait_type": "Date",
      "value": "2024-01-15"
    }
  ]
}
```

## Production Setup

### 1. Deploy NFT Contract

The NFT contract is already included in the project. To deploy it:

#### Step 1: Prepare for Deployment
```bash
cd contracts
pnpm install
pnpm run compile
```

#### Step 2: Set Environment Variables
Create a `.env.local` file in the `contracts` directory:
```bash
PRIVATE_KEY=0x... # Your wallet private key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key # Optional, for contract verification
```

#### Step 3: Deploy to Base Sepolia (Testnet)
```bash
pnpm run deploy:base-sepolia
```

#### Step 4: Deploy to Base Mainnet (Production)
```bash
pnpm run deploy:base
```

#### Step 5: Configure Main App
Add the deployed contract address to your main app's `.env.local`:
```bash
NFT_CONTRACT_ADDRESS=0x... # Your deployed contract address
CONTRACT_OWNER_PRIVATE_KEY=0x... # Same private key used for deployment
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### 2. Test the Integration
1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the NFT minting flow:**
   - Play a game of Friendsweeper
   - Complete the game (win or lose)
   - Click "Mint as NFT" button
   - Connect your wallet
   - Confirm the transaction
   - Check your NFT on [BaseScan](https://sepolia.basescan.org/)

### 3. Contract Details

The included NFT contract uses OpenZeppelin v5 and includes:
- **ERC-1155 standard compliance** (Multi-token standard)
- Owner-only minting
- Custom metadata URI support
- Event emission for minting
- **Batch minting capabilities**
- Withdrawal functionality for any ETH sent to contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FriendsweeperNFT is ERC1155, Ownable {
    uint256 private _tokenIds;
    
    constructor() ERC1155("") Ownable(msg.sender) {}
    
    function mint(address to, string memory metadataURI, uint256 amount) public onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _mint(to, newTokenId, amount, "");
        _setTokenURI(newTokenId, metadataURI);
        return newTokenId;
    }
    
    function batchMint(address to, string[] memory metadataURIs, uint256[] memory amounts) public onlyOwner returns (uint256[] memory) {
        // Batch mint multiple NFTs at once
    }
}
```

### 2. Cloudflare R2 Configuration

The NFT integration now uses your existing Cloudflare R2 bucket. The Cloudflare Worker has been updated to handle both image and metadata uploads:

#### New Cloudflare Worker Endpoints:
- `/upload/board-image` - Uploads game board images
- `/upload/nft-metadata` - Uploads NFT metadata JSON files

#### File Structure in R2 Bucket:
```
your-bucket.r2.dev/
├── board-images/
│   ├── 1234567890_abc123.png
│   └── 1234567891_def456.png
└── nft-metadata/
    ├── 1234567890_abc123.json
    └── 1234567891_def456.json
```

The integration automatically uses your existing Cloudflare setup - no additional configuration needed!

### 3. Update API Endpoint

The NFT minting API now uses Cloudflare R2 for storage. The metadata URL will point to your Cloudflare bucket:

```typescript
// Example using ethers.js
import { ethers } from 'ethers'
import NFTContract from './contracts/FriendsweeperNFT.json'

const contract = new ethers.Contract(
  NFT_CONTRACT_ADDRESS,
  NFTContract.abi,
  signer
)

// metadataUrl will be something like: https://your-bucket.r2.dev/nft-metadata/1234567890_abc123.json
const tx = await contract.mint(userAddress, metadataUrl)
const receipt = await tx.wait()

return {
  success: true,
  tokenId: receipt.events[0].args.tokenId.toString(),
  transactionHash: tx.hash
}
```

## Environment Variables

The NFT integration uses your existing Cloudflare setup. Make sure these are set in your `.env.local`:

```bash
# Cloudflare Worker (existing)
CLOUDFLARE_WORKER_URL=https://your-worker.your-subdomain.workers.dev

# NFT Contract (for production)
NFT_CONTRACT_ADDRESS=your_deployed_contract_address

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=84532  # Base Sepolia
```

## Supported Networks

Currently configured for:
- **Base Sepolia** (Testnet)
- **Base Mainnet** (Production)

## Future Enhancements

1. **Batch Minting**: Allow minting multiple game results at once
2. **Rarity System**: Implement rarity based on game performance
3. **Collection**: Create a Friendsweeper NFT collection
4. **Marketplace Integration**: List NFTs on marketplaces
5. **Social Features**: Share NFT achievements on social media

## Troubleshooting

### Common Issues

1. **Wallet Not Connected**: Ensure wallet is connected before minting
2. **Insufficient Gas**: Make sure wallet has enough ETH for gas fees
3. **Network Mismatch**: Ensure wallet is on the correct network (Base Sepolia)
4. **Board Image Missing**: Board image must be captured before minting

### Error Messages

- "Wallet not connected": Connect your wallet first
- "No board image available": Complete a game to generate board image
- "Failed to mint NFT": Check network connection and try again
- "Transaction failed": Check gas fees and wallet balance
