# Marketplace & Royalty System Deployment Guide

## 🚀 **Deployment Steps**

### **Step 1: Prepare Environment Variables**

Create or update your `.env.local` file with the following variables:

```bash
# NFT Contract Configuration
NFT_CONTRACT_ADDRESS=0x... # Your deployed contract address
CONTRACT_OWNER_PRIVATE_KEY=0x... # Private key for contract operations
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org

# Cloudflare Configuration (existing)
CLOUDFLARE_WORKER_URL=https://your-worker.your-subdomain.workers.dev

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=84532  # Base Sepolia for testing
```

### **Step 2: Deploy the Contract**

#### **Option A: Deploy to Base Sepolia (Testnet)**
```bash
cd contracts
pnpm run deploy:base-sepolia
```

#### **Option B: Deploy to Base Mainnet (Production)**
```bash
cd contracts
pnpm run deploy:base
```

### **Step 3: Update Contract Address**

After deployment, update your `.env.local` with the new contract address:

```bash
NFT_CONTRACT_ADDRESS=0x... # New deployed address
```

## 🧪 **Testing Plan**

### **Phase 1: Basic NFT Minting**
1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test NFT Minting Flow:**
   - Play a game of Friendsweeper
   - Complete the game (win or lose)
   - Click "Mint as NFT" button
   - Connect wallet and confirm transaction
   - Verify NFT appears in wallet

### **Phase 2: Marketplace Functionality**

#### **Test Listing NFTs:**
1. **Access Marketplace:**
   - After successful minting, click "Open Marketplace"
   - Verify marketplace modal opens

2. **List NFT for Sale:**
   - Enter a price (e.g., 0.01 ETH)
   - Click "List NFT"
   - Confirm transaction
   - Verify listing appears

3. **Verify Listing Data:**
   - Check listing price is correct
   - Verify seller address matches
   - Confirm listing timestamp

#### **Test Buying NFTs:**
1. **Switch to Different Wallet:**
   - Use a different wallet/account
   - Navigate to the same NFT listing

2. **Purchase NFT:**
   - Click "Buy for X ETH"
   - Confirm transaction with sufficient ETH
   - Verify NFT transfers to buyer
   - Check seller receives 95% of payment
   - Verify royalty recipient receives 5%

### **Phase 3: Royalty System Verification**

#### **Test Royalty Distribution:**
1. **Monitor Royalty Payments:**
   - Check royalty recipient address: `0xF51Fe86498b83538E902e160F2D80c34C7d6b816`
   - Verify 5% of sale price is sent automatically
   - Confirm seller receives 95% of sale price

2. **Verify Multiple Sales:**
   - List and sell the same NFT multiple times
   - Confirm royalty is paid on each sale
   - Check cumulative royalty payments

### **Phase 4: Edge Cases & Error Handling**

#### **Test Error Scenarios:**
1. **Insufficient Funds:**
   - Try to buy NFT without enough ETH
   - Verify proper error message

2. **Unauthorized Actions:**
   - Try to delist NFT from different wallet
   - Attempt to buy your own NFT
   - Verify access controls work

3. **Invalid Inputs:**
   - Try to list with zero price
   - Test with invalid token IDs
   - Verify input validation

## 🔍 **Verification Checklist**

### **Contract Deployment:**
- [ ] Contract deployed successfully
- [ ] Contract address updated in environment
- [ ] Contract verified on BaseScan
- [ ] All functions accessible

### **NFT Minting:**
- [ ] NFTs mint successfully
- [ ] Metadata uploaded to Cloudflare R2
- [ ] Token IDs assigned correctly
- [ ] Events emitted properly

### **Marketplace Features:**
- [ ] NFTs can be listed for sale
- [ ] Listing information displays correctly
- [ ] NFTs can be purchased
- [ ] Ownership transfers properly
- [ ] Listings are removed after sale

### **Royalty System:**
- [ ] 5% royalty calculated correctly
- [ ] Royalty sent to correct address
- [ ] Seller receives 95% of sale price
- [ ] Royalty paid on all sales
- [ ] ERC-2981 compliance verified

### **UI/UX:**
- [ ] Marketplace modal opens correctly
- [ ] Price input validation works
- [ ] Loading states display properly
- [ ] Success/error messages show
- [ ] Mobile responsiveness

## 🐛 **Troubleshooting**

### **Common Issues:**

#### **Contract Deployment Fails:**
- Check private key format (must start with 0x)
- Verify sufficient ETH for gas fees
- Ensure RPC URL is correct and accessible

#### **NFT Minting Fails:**
- Verify wallet is connected
- Check network is correct (Base Sepolia)
- Ensure board image is generated
- Verify contract address is correct

#### **Marketplace Issues:**
- Check if NFT is already listed
- Verify ownership of NFT
- Ensure sufficient ETH for transactions
- Check gas limits

#### **Royalty Not Paid:**
- Verify royalty recipient address is correct
- Check transaction logs for royalty events
- Ensure contract has sufficient ETH for transfers

### **Debug Commands:**

#### **Check Contract State:**
```bash
# Get total token types
npx hardhat console --network base-sepolia
> const contract = await ethers.getContractAt("FriendsweeperNFT", "CONTRACT_ADDRESS")
> await contract.totalTokenTypes()
```

#### **Verify Listing:**
```bash
# Get listing information
> await contract.getListing(1)
```

#### **Check Royalty Info:**
```bash
# Get royalty recipient
> await contract.ROYALTY_RECIPIENT()
> await contract.ROYALTY_PERCENTAGE()
```

## 📊 **Success Metrics**

### **Technical Metrics:**
- [ ] 100% successful NFT minting
- [ ] 100% successful marketplace transactions
- [ ] 100% accurate royalty distribution
- [ ] < 2 second API response times
- [ ] Zero failed transactions due to contract errors

### **User Experience Metrics:**
- [ ] Intuitive marketplace interface
- [ ] Clear transaction feedback
- [ ] Proper error handling
- [ ] Mobile-friendly design
- [ ] Fast loading times

## 🎯 **Next Steps After Testing**

1. **Address Issues:** Fix any bugs or issues found during testing
2. **Optimize Gas:** Reduce gas costs if needed
3. **Add Features:** Implement additional marketplace features
4. **Deploy to Mainnet:** Move to production when ready
5. **Monitor Performance:** Track usage and performance metrics

## 📞 **Support**

If you encounter issues during deployment or testing:

1. **Check the logs** in your terminal for error messages
2. **Verify environment variables** are set correctly
3. **Test on testnet first** before mainnet deployment
4. **Review contract code** for any syntax errors
5. **Check BaseScan** for transaction status and contract verification

---

**Happy Testing! 🚀**
