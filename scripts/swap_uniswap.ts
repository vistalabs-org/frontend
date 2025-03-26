// Uniswap V4 Swap Script for Unichain Sepolia
// This script demonstrates how to perform a swap on either the Yes or No pool

import { ethers } from 'ethers';
import { Pool } from '@uniswap/v4-core';
import { SwapRouter } from '@uniswap/v4-periphery';

// Connect to Unichain Sepolia
async function main() {
  // Connect to the Sepolia network
  const provider = new ethers.providers.JsonRpcProvider('https://sepolia.unichain.infura.io/v3/YOUR_INFURA_KEY');
  
  // Add your wallet private key here (or use environment variables in production)
  const privateKey = 'YOUR_PRIVATE_KEY';
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`Connected to wallet: ${wallet.address}`);

  // Market data from the provided information
  const marketData = {
    collateralAddress: "0x2ddB197a62723880D182B64cd4f48425A881Ce23",
    creator: "0x39dc391f8FFE71156212C7c3196Ef09B9C0bdDf8",
    description: "Market resolves to YES if ETH is above 1000",
    endTimestamp: 1745415877n,
    noToken: "0xa575B90f2723cB9F1f7aff49E6139dE8374c53b1",
    yesToken: "0x89706D13a473B98C83775673c3e308CA874Ad18F",
    yesPoolKey: {
      currency0: "0x2ddB197a62723880D182B64cd4f48425A881Ce23",
      currency1: "0x89706D13a473B98C83775673c3e308CA874Ad18F",
      fee: 10000,
      hooks: "0x351af7D9f5F2BeC762bEb4a5627FF29749458A80",
      tickSpacing: 100
    },
    noPoolKey: {
      currency0: "0x2ddB197a62723880D182B64cd4f48425A881Ce23", 
      currency1: "0xa575B90f2723cB9F1f7aff49E6139dE8374c53b1",
      fee: 10000,
      hooks: "0x351af7D9f5F2BeC762bEb4a5627FF29749458A80",
      tickSpacing: 100
    }
  };

  // ABI for ERC20 tokens (for approvals)
  const erc20Abi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)"
  ];

  // Choose which pool to use - 'yes' or 'no'
  const poolChoice = 'yes'; // or 'no'
  
  // Amount to swap (in smallest units)
  const amountToSwap = ethers.utils.parseUnits('1.0', 18); // Adjust based on token decimals
  
  // Set up the swap parameters based on pool choice
  const performSwap = async () => {
    // Get the appropriate pool key and tokens based on choice
    const poolKey = poolChoice === 'yes' ? marketData.yesPoolKey : marketData.noPoolKey;
    const outcomeToken = poolChoice === 'yes' ? marketData.yesToken : marketData.noToken;
    
    // Load the collateral token contract
    const collateralToken = new ethers.Contract(
      marketData.collateralAddress,
      erc20Abi,
      wallet
    );
    
    // Check balance of collateral token
    const balance = await collateralToken.balanceOf(wallet.address);
    console.log(`Collateral token balance: ${ethers.utils.formatUnits(balance, await collateralToken.decimals())}`);
    
    if (balance.lt(amountToSwap)) {
      console.error("Insufficient balance for swap");
      return;
    }
    
    // Approve the router to spend tokens
    const routerAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with actual SwapRouter address
    const approveTx = await collateralToken.approve(routerAddress, amountToSwap);
    await approveTx.wait();
    console.log(`Approved ${ethers.utils.formatUnits(amountToSwap, await collateralToken.decimals())} tokens`);
    
    // Create the swap router instance
    const swapRouter = new ethers.Contract(
      routerAddress,
      SwapRouter.abi,
      wallet
    );
    
    // Prepare swap parameters
    const params = {
      tokenIn: marketData.collateralAddress,
      tokenOut: outcomeToken,
      fee: poolKey.fee,
      recipient: wallet.address,
      deadline: Math.floor(Date.now() / 1000) + 1800, // 30 minutes from now
      amountIn: amountToSwap,
      amountOutMinimum: 0, // Set a minimum amount to protect from slippage
      sqrtPriceLimitX96: 0, // Set to 0 to accept any price
    };
    
    // Execute the swap
    console.log(`Initiating swap in the ${poolChoice.toUpperCase()} pool...`);
    const swapTx = await swapRouter.exactInputSingle(params);
    const receipt = await swapTx.wait();
    
    console.log(`Swap successful! Transaction hash: ${receipt.transactionHash}`);
    console.log(`Swapped ${ethers.utils.formatUnits(amountToSwap, await collateralToken.decimals())} collateral tokens for ${poolChoice} outcome tokens`);
  };
  
  // Execute the swap
  await performSwap();
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during execution:", error);
    process.exit(1);
  });