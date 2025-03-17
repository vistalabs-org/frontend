import { JsonRpcProvider } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    // Connect to the Ethereum network
    const provider = new JsonRpcProvider(process.env.SEPOLIA_URL);

    // Get block by number
    const blockNumber = "latest";
    const block = await provider.getBlock(blockNumber);

    console.log(block);
  } catch (error) {
    console.error("Error fetching block data:", error);
  }
}

main().catch(console.error);