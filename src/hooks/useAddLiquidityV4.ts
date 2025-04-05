import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Pool } from '@uniswap/v4-sdk'; // Assuming you have a Pool entity similar to the SDK's
import { Position } from '@uniswap/v4-sdk'; // Using the SDK's Position entity
import { V4PositionManager, MintOptions } from '@uniswap/v4-sdk';
import { Percent, Currency, NativeCurrency, Token } from '@uniswap/sdk-core';
import { POOL_MODIFY_LIQUIDITY_ROUTER } from '@/app/constants'; // Your contract address
import { wagmiConfig } from '@/lib/wagmi';
import JSBI from 'jsbi';
import { parseUnits } from 'ethers';

// Define the necessary options based on SDK types
interface AddLiquidityV4Options {
  pool: Pool; // Use your Pool entity or adapt SDK's Pool
  tickLower: number;
  tickUpper: number;
  liquidityAmount: string; // Liquidity amount as a string (will be parsed)
  recipient: string; // Required for minting new positions
  deadline: number; // Timestamp in seconds
  slippageTolerance: Percent;
  createPool?: boolean; // Optional: if the pool might not exist
  sqrtPriceX96?: string; // Optional: required if createPool is true
  useNative?: NativeCurrency; // Optional: if paying with native currency
  hookData?: string; // Optional: hook data
}

export function useAddLiquidityV4() {
  const { address: account } = useAccount();
  const { writeContractAsync, data: txHash, isPending: isSubmitting, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed, error: waitError } = useWaitForTransactionReceipt({
    hash: txHash,
    config: wagmiConfig,
  });

  const [error, setError] = useState<string | null>(null);

  const addLiquidity = useCallback(async ({
    pool,
    tickLower,
    tickUpper,
    liquidityAmount,
    recipient,
    deadline,
    slippageTolerance,
    createPool = false,
    sqrtPriceX96,
    useNative,
    hookData = '0x',
  }: AddLiquidityV4Options): Promise<`0x${string}` | null> => {
    setError(null);

    if (!account) {
      setError("Wallet not connected");
      return null;
    }
    if (!pool) {
        setError("Pool data is missing");
        return null;
    }

    try {
        // Ensure pool currencies are Token instances for the SDK Position
        const currency0 = pool.currency0 instanceof Token ? pool.currency0 : new Token(pool.currency0.chainId, pool.currency0.address, pool.currency0.decimals, pool.currency0.symbol, pool.currency0.name);
        const currency1 = pool.currency1 instanceof Token ? pool.currency1 : new Token(pool.currency1.chainId, pool.currency1.address, pool.currency1.decimals, pool.currency1.symbol, pool.currency1.name);

        // Adapt your Pool entity to create an SDK-compatible Pool object for Position
        // This might require mapping properties like fee, tickSpacing, etc.
        // For simplicity, assuming direct compatibility or necessary adaptation here
        const sdkPool = new Pool(
            currency0,
            currency1,
            pool.fee,
            pool.tickSpacing,
            pool.hooks, // Assuming hooks address is available
            pool.sqrtRatioX96.toString(), // Assuming sqrtRatioX96 is available
            pool.liquidity.toString(), // Assuming liquidity is available
            pool.tickCurrent // Assuming tickCurrent is available
        );


      // Parse the liquidity amount string into JSBI
      // Assuming the input string represents the value in base units (e.g., wei for 18 decimals)
      // If the input string is in ether format, parse it first:
      // const parsedLiquidity = parseUnits(liquidityAmount, 18); // Adjust decimals if needed
      // const liquidityBI = JSBI.BigInt(parsedLiquidity.toString());
      // If the string is already in base units:
      const liquidityBI = JSBI.BigInt(liquidityAmount);


      // Create the Position object using the Uniswap V4 SDK
      const position = new Position({
        pool: sdkPool, // Use the SDK-compatible pool object
        tickLower,
        tickUpper,
        liquidity: liquidityBI,
      });

      // Define options for adding liquidity (MintOptions for new positions)
      const mintOptions: MintOptions = {
        recipient,
        deadline,
        slippageTolerance,
        createPool,
        sqrtPriceX96: createPool ? sqrtPriceX96 : undefined, // Only needed if creating pool
        useNative,
        hookData,
      };

      // Generate the call parameters using the SDK's PositionManager
      const { calldata, value } = V4PositionManager.addCallParameters(position, mintOptions);

      // Execute the transaction
      const hash = await writeContractAsync({
        address: POOL_MODIFY_LIQUIDITY_ROUTER, // Use your Position Manager contract address
        abi: V4PositionManager.INTERFACE.fragments, // Use ABI from SDK
        functionName: 'multicall', // addCallParameters often returns a multicall
        args: [calldata], // The SDK packs arguments inside the multicall data
        value: BigInt(value), // Convert hex value to BigInt
      });

      return hash;

    } catch (err: any) {
      console.error("Error adding liquidity via SDK:", err);
      const message = err.shortMessage || err.message || "Failed to prepare add liquidity transaction.";
      setError(message);
      return null;
    }
  }, [account, writeContractAsync]);

  // Combine write and wait errors
  const combinedError = writeError || waitError || error;

  return {
    addLiquidity,
    txHash,
    isSubmitting, // Pending submission to wallet
    isConfirming, // Pending confirmation on chain
    isConfirmed,  // Confirmed on chain
    error: combinedError
  };
}