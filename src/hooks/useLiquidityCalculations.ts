import { useState, useEffect, useCallback } from 'react';
import JSBI from 'jsbi';
import { parseUnits, formatUnits } from 'viem';

// Constants
const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));

// --- Uniswap V3 Math Helpers (adapted) ---
// These helpers calculate the maximum liquidity that can be provided for given amounts
// based on price ranges. For full range, sqrtRatioA is near 0 and sqrtRatioB is near infinity.

// Accepts PRE-SCALED amount0 (JSBI) based on its decimals
function maxLiquidityForAmount0Precise(sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, amount0Scaled: JSBI): JSBI {
    if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
      [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
    }
    
    const numerator = JSBI.multiply(
      JSBI.multiply(amount0Scaled, sqrtRatioAX96), // Use amount0Scaled directly
      sqrtRatioBX96
    );
    const denominator = JSBI.multiply(Q96, JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96));
    
    if (JSBI.equal(denominator, JSBI.BigInt(0))) return JSBI.BigInt(0);

    return JSBI.divide(numerator, denominator);
}

// Accepts PRE-SCALED amount1 (JSBI) based on its decimals
function maxLiquidityForAmount1(sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, amount1Scaled: JSBI): JSBI {
    if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
      [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
    }

    const denominator = JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96);
    
    if (JSBI.equal(denominator, JSBI.BigInt(0))) return JSBI.BigInt(0);
    
    return JSBI.divide(
      JSBI.multiply(amount1Scaled, Q96), // Use amount1Scaled directly
      denominator
    );
}
  
// Accepts PRE-SCALED amounts (JSBI) based on their decimals
function maxLiquidityForAmounts(
    sqrtRatioCurrentX96: JSBI,
    sqrtRatioAX96: JSBI, // Lower bound sqrt price
    sqrtRatioBX96: JSBI, // Upper bound sqrt price
    amount0Scaled: JSBI, // PRE-SCALED amount0
    amount1Scaled: JSBI  // PRE-SCALED amount1
  ): JSBI {
    if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
      [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
    }

    // Amounts are already scaled JSBI, no internal parsing needed

    if (JSBI.lessThanOrEqual(sqrtRatioCurrentX96, sqrtRatioAX96)) {
        // Price is below the range, only amount0 is needed
        return maxLiquidityForAmount0Precise(sqrtRatioAX96, sqrtRatioBX96, amount0Scaled);
    } else if (JSBI.lessThan(sqrtRatioCurrentX96, sqrtRatioBX96)) {
        // Price is within the range, need both amounts
        const liquidity0 = maxLiquidityForAmount0Precise(sqrtRatioCurrentX96, sqrtRatioBX96, amount0Scaled);
        const liquidity1 = maxLiquidityForAmount1(sqrtRatioAX96, sqrtRatioCurrentX96, amount1Scaled);
        // Use the limiting amount (minimum liquidity)
        return JSBI.lessThan(liquidity0, liquidity1) ? liquidity0 : liquidity1;
    } else {
        // Price is above the range, only amount1 is needed
        return maxLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1Scaled);
    }
}
// --- End Uniswap Math Helpers ---

interface PoolData {
  sqrtPriceX96?: bigint; 
  price?: number; // Added price for convenience
  decimals0?: number;
  decimals1?: number;
}

interface UseLiquidityCalculationsProps {
  poolData?: PoolData | null;
  initialAmount0?: string;
}

export function useLiquidityCalculations({
  poolData,
  initialAmount0 = '',
}: UseLiquidityCalculationsProps) {
  const [amount0, setAmount0] = useState<string>(initialAmount0);
  const [amount1, setAmount1] = useState<string>('');
  const [estimatedLiquidity, setEstimatedLiquidity] = useState<string>('0');

  const decimals0 = poolData?.decimals0;
  const decimals1 = poolData?.decimals1;

  // Recalculate amount1 when amount0 or pool price changes
  useEffect(() => {
    if (amount0 && parseFloat(amount0) > 0 && poolData?.sqrtPriceX96 && decimals1 !== undefined) {
      try {
        const amount0Num = parseFloat(amount0);
        if (isNaN(amount0Num) || amount0Num <= 0) {
           setAmount1('');
           return;
        }

        // Calculate price of token1 (Outcome) in terms of token0 (USDC)
        const sqrtPriceNum = Number(poolData.sqrtPriceX96) / (2**96);
        const priceOfToken1InToken0 = sqrtPriceNum * sqrtPriceNum;

        if (isNaN(priceOfToken1InToken0) || priceOfToken1InToken0 <= 0) {
          setAmount1('');
          return;
        }

        // amount1 = amount0 * price
        const calculatedAmount1 = amount0Num * priceOfToken1InToken0;
        
        // Format based on token1's decimals
        setAmount1(calculatedAmount1 > 0 ? calculatedAmount1.toFixed(Math.min(decimals1, 8)) : '0.00'); // Use decimals, cap precision
      } catch (error) {
        console.error("Error calculating amount1:", error);
        setAmount1('');
      }
    } else if (!amount0) {
      // Clear amount1 if amount0 is cleared
      setAmount1('');
    }
  }, [amount0, poolData?.sqrtPriceX96, decimals1]);

  // Recalculate estimated liquidity when amounts or pool price change
  useEffect(() => {
    console.log("[useLiquidityCalculations] Estimating liquidity effect triggered.", { amount0, amount1, poolData, decimals0, decimals1 });

    if (amount0 && parseFloat(amount0) > 0 && amount1 && parseFloat(amount1) > 0 && poolData?.sqrtPriceX96 && decimals0 !== undefined && decimals1 !== undefined) {
      try {
        console.log("[useLiquidityCalculations] Conditions met, attempting calculation...");
        
        // --- Scale amounts BEFORE calling math helpers ---
        let amount0ScaledJSBI: JSBI;
        let amount1ScaledJSBI: JSBI;
        try {
            amount0ScaledJSBI = JSBI.BigInt(parseUnits(amount0, decimals0).toString());
            amount1ScaledJSBI = JSBI.BigInt(parseUnits(amount1, decimals1).toString());
        } catch (parseError) {
            console.error("[useLiquidityCalculations] Error parsing amounts before calculation:", parseError);
            setEstimatedLiquidity('0');
            return; // Exit if parsing fails
        }
        // -----------------------------------------------

        const minTick = -887272;
        const maxTick = 887272;
        const minSqrtPriceX96 = JSBI.BigInt('4295128739');
        const maxSqrtPriceX96 = JSBI.BigInt('1461446703485210103287273052203988822378723970342');
        
        const currentSqrtPriceX96 = JSBI.BigInt(poolData.sqrtPriceX96.toString());
        
        console.log("[useLiquidityCalculations] Inputs for maxLiquidityForAmounts (scaled):", { // Log scaled inputs
            currentSqrtPriceX96: currentSqrtPriceX96.toString(),
            minSqrtPriceX96: minSqrtPriceX96.toString(),
            maxSqrtPriceX96: maxSqrtPriceX96.toString(),
            amount0Scaled: amount0ScaledJSBI.toString(),
            amount1Scaled: amount1ScaledJSBI.toString()
        });

        // Pass the PRE-SCALED JSBI amounts to the calculation function
        const liquidityJSBI = maxLiquidityForAmounts(
          currentSqrtPriceX96,
          minSqrtPriceX96,
          maxSqrtPriceX96,
          amount0ScaledJSBI, // Pass scaled JSBI
          amount1ScaledJSBI  // Pass scaled JSBI
        );

        console.log("[useLiquidityCalculations] Raw liquidityJSBI result:", liquidityJSBI.toString());

        // const liquidityBigInt = BigInt(liquidityJSBI.toString());
        // const formattedLiquidity = formatUnits(liquidityBigInt, 18); // Assume LP token is 18 decimals
        // const finalValue = parseFloat(formattedLiquidity).toFixed(6);

        // --- Set estimatedLiquidity to the RAW liquidity value as a string --- 
        const finalValue = liquidityJSBI.toString();
        console.log("[useLiquidityCalculations] Setting estimatedLiquidity to (raw value string):", finalValue);
        setEstimatedLiquidity(finalValue);
      } catch (error) {
        console.error('[useLiquidityCalculations] Error calculating liquidity:', error);
        setEstimatedLiquidity('0');
      }
    } else {
        console.log("[useLiquidityCalculations] Conditions NOT met, setting liquidity to 0.");
        setEstimatedLiquidity('0');
    }
  }, [amount0, amount1, poolData?.sqrtPriceX96, decimals0, decimals1]);

  const handleAmount0Change = useCallback((value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
      setAmount0(cleanValue);
    }
  }, []);

  // Primarily for reference, maybe not directly set if amount1 is derived
  const handleAmount1Change = useCallback((value: string) => {
     // Currently, amount1 is derived from amount0, so this might not be used 
     // If strategy changes, implement setting logic here.
     console.warn("handleAmount1Change called, but amount1 is derived.");
     // Example if needed: 
     // const cleanValue = value.replace(/[^0-9.]/g, '');
     // if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
     //   setAmount1(cleanValue); 
     //   setAmount0(''); // Clear amount0 if amount1 is set manually?
     // }
   }, []);

  return {
    amount0,
    amount1,
    estimatedLiquidity,
    handleAmount0Change,
    handleAmount1Change, // Return even if not primary input method
    setAmount0, // Allow external setting if needed
    setAmount1, // Allow external setting if needed
  };
} 