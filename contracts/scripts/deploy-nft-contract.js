// Deployment script for FriendsweeperNFT contract
// This script should be run with Hardhat

const hre = require("hardhat");

async function main() {
  console.log("Deploying FriendsweeperNFT ERC-1155 contract...");
  
  // Debug: Check environment variables
  console.log("Environment check:");
  console.log("- PRIVATE_KEY exists:", !!process.env.PRIVATE_KEY);
  console.log("- PRIVATE_KEY length:", process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.length : 0);
  console.log("- BASE_SEPOLIA_RPC_URL:", process.env.BASE_SEPOLIA_RPC_URL);
  
  // Debug: Check if we have a signer
  const signers = await hre.ethers.getSigners();
  console.log("Number of signers:", signers.length);
  
  if (signers.length === 0) {
    throw new Error("No signers found. Check your PRIVATE_KEY in .env.local");
  }
  
  const [deployer] = signers;
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Get the contract factory
  const FriendsweeperNFT = await hre.ethers.getContractFactory("FriendsweeperNFT");
  
  // Deploy the contract (ERC-1155 doesn't need constructor parameters)
  const friendsweeperNFT = await FriendsweeperNFT.deploy();

  // Wait for deployment to finish
  await friendsweeperNFT.waitForDeployment();

  const address = await friendsweeperNFT.getAddress();
  console.log("FriendsweeperNFT deployed to:", address);

  // Verify the contract on Etherscan (if on a supported network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    
    try {
      // Wait for a few confirmations
      const receipt = await friendsweeperNFT.deploymentTransaction().wait(2);
      console.log("Transaction confirmed in block:", receipt.blockNumber);
      
      // Try to verify the contract
      try {
        await hre.run("verify:verify", {
          address: address,
          constructorArguments: [],
        });
        console.log("Contract verified on Etherscan");
      } catch (verifyError) {
        console.log("Verification failed:", verifyError.message);
      }
    } catch (waitError) {
      console.log("Error waiting for confirmations:", waitError.message);
    }
  }

  console.log("Deployment completed!");
  console.log("Contract address:", address);
  console.log("Network:", hre.network.name);
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
