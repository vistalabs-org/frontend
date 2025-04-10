import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { getPublicClient } from '@wagmi/core';
import { wagmiConfig } from '@/app/providers'; // Assuming wagmiConfig is here
import MockERC20Abi from '@/contracts/MockERC20.json';

const MAX_UINT256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');

interface UseV4ApprovalsProps {
  token0Address?: `0x${string}`;
  token1Address?: `0x${string}`;
  token0Decimals?: number;
  token1Decimals?: number;
  amount0: string; // User input amount for token0
  amount1: string; // User input or derived amount for token1
  hookAddress?: `0x${string}`;
  positionManagerAddress: `0x${string}`; 
}

interface ApprovalStatus {
  needsApproval: boolean;
  isApproving: boolean;
  isConfirming: boolean;
  approvalError: string | null;
  approve: () => Promise<void>;
  refetchAllowances: () => void;
  approvalTxHash?: `0x${string}`;
}

export function useV4Approvals({
  token0Address,
  token1Address,
  token0Decimals,
  token1Decimals,
  amount0,
  amount1,
  hookAddress,
  positionManagerAddress,
}: UseV4ApprovalsProps): ApprovalStatus {
  const { address: userAddress } = useAccount();
  const [needsApprovalState, setNeedsApprovalState] = useState<boolean>(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const { data: approveTxHash, writeContract: approveWriteContract, isPending: isApprovingWrite, error: approveWriteError } = useWriteContract();
  const publicClient = getPublicClient(wagmiConfig);

  // --- Allowance Reads (Cached via useReadContract) --- 
  // Hook Allowances
  const { data: token0AllowanceHook_cached, refetch: refetchToken0AllowanceHook, isLoading: token0AllowanceHookLoading } = useReadContract({
    address: token0Address,
    abi: MockERC20Abi,
    functionName: 'allowance',
    args: userAddress && hookAddress ? [userAddress, hookAddress] : undefined,
    query: { enabled: !!userAddress && !!token0Address && !!hookAddress },
  });
  const { data: token1AllowanceHook_cached, refetch: refetchToken1AllowanceHook, isLoading: token1AllowanceHookLoading } = useReadContract({
    address: token1Address,
    abi: MockERC20Abi,
    functionName: 'allowance',
    args: userAddress && hookAddress ? [userAddress, hookAddress] : undefined,
    query: { enabled: !!userAddress && !!token1Address && !!hookAddress },
  });
  // Position Manager Allowances
  const { data: token0AllowanceManager_cached, refetch: refetchToken0AllowanceManager, isLoading: token0AllowanceManagerLoading } = useReadContract({
      address: token0Address,
      abi: MockERC20Abi,
      functionName: 'allowance',
      args: userAddress && positionManagerAddress ? [userAddress, positionManagerAddress] : undefined,
      query: { enabled: !!userAddress && !!token0Address && !!positionManagerAddress },
  });
  const { data: token1AllowanceManager_cached, refetch: refetchToken1AllowanceManager, isLoading: token1AllowanceManagerLoading } = useReadContract({
      address: token1Address,
      abi: MockERC20Abi,
      functionName: 'allowance',
      args: userAddress && positionManagerAddress ? [userAddress, positionManagerAddress] : undefined,
      query: { enabled: !!userAddress && !!token1Address && !!positionManagerAddress },
  });

  // --- Transaction Confirmation ---
  const { isLoading: isConfirming, isSuccess: isApprovalConfirmed, error: confirmationError } = useWaitForTransactionReceipt({ hash: approveTxHash });

  // --- State Derivation: needsApproval --- 
  useEffect(() => {
    // console.log('[useV4Approvals Check State Effect] Triggered.'); // Reduced verbosity
    // Basic checks
    if (!userAddress || !positionManagerAddress || !token0Address || !token1Address || token0Decimals === undefined || token1Decimals === undefined || !amount0 || !amount1 || parseFloat(amount0) <= 0 || parseFloat(amount1) <= 0) {
      // console.log('[useV4Approvals Check State Effect] Basic data missing or amounts invalid, setting needsApproval=false.'); // Reduced verbosity
      setNeedsApprovalState(false);
      return;
    }
    // Wait for ALL cached allowances to load initially
    const allowancesLoading = token0AllowanceHookLoading || token1AllowanceHookLoading || token0AllowanceManagerLoading || token1AllowanceManagerLoading;
    if (allowancesLoading) {
      // console.log('[useV4Approvals Check State Effect] Cached allowances still loading, waiting...'); // Reduced verbosity
      return; // Wait
    }

    let token0NeededBI = BigInt(0);
    try { token0NeededBI = parseUnits(amount0, token0Decimals); } catch { console.warn('[useV4Approvals Check State Effect] Failed to parse amount0'); }
    let token1NeededBI = BigInt(0);
    try { token1NeededBI = parseUnits(amount1, token1Decimals); } catch { console.warn('[useV4Approvals Check State Effect] Failed to parse amount1'); }

    // Convert cached allowances to BigInt
    const token0HookApprovedBI_cached = (token0AllowanceHook_cached !== undefined && token0AllowanceHook_cached !== null) ? BigInt(token0AllowanceHook_cached.toString()) : BigInt(0);
    const token1HookApprovedBI_cached = (token1AllowanceHook_cached !== undefined && token1AllowanceHook_cached !== null) ? BigInt(token1AllowanceHook_cached.toString()) : BigInt(0);
    const token0ManagerApprovedBI_cached = (token0AllowanceManager_cached !== undefined && token0AllowanceManager_cached !== null) ? BigInt(token0AllowanceManager_cached.toString()) : BigInt(0);
    const token1ManagerApprovedBI_cached = (token1AllowanceManager_cached !== undefined && token1AllowanceManager_cached !== null) ? BigInt(token1AllowanceManager_cached.toString()) : BigInt(0);
    
    // console.log(`[useV4Approvals Check State Effect] Cached Allowances: Manager0=${token0ManagerApprovedBI_cached}, Manager1=${token1ManagerApprovedBI_cached}, Hook0=${token0HookApprovedBI_cached}, Hook1=${token1HookApprovedBI_cached}`); // Reduced verbosity
    // console.log(`[useV4Approvals Check State Effect] Amounts Needed: Token0=${token0NeededBI}, Token1=${token1NeededBI}`); // Reduced verbosity

    // Check if manager needs approval (based on cached data)
    const requiresToken0ManagerApproval = token0NeededBI > 0 && token0ManagerApprovedBI_cached < token0NeededBI;
    const requiresToken1ManagerApproval = token1NeededBI > 0 && token1ManagerApprovedBI_cached < token1NeededBI;

    // Check if hook needs approval (based on cached data)
    const requiresToken0HookApproval = !!hookAddress && token0NeededBI > 0 && token0HookApprovedBI_cached < token0NeededBI;
    const requiresToken1HookApproval = !!hookAddress && token1NeededBI > 0 && token1HookApprovedBI_cached < token1NeededBI;
    
    // console.log(`[useV4Approvals Check State Effect] Needs Checks (Cached): Manager0=${requiresToken0ManagerApproval}, Manager1=${requiresToken1ManagerApproval}, Hook0=${requiresToken0HookApproval}, Hook1=${requiresToken1HookApproval}`); // Reduced verbosity

    const newNeedsApproval = requiresToken0ManagerApproval || requiresToken1ManagerApproval || requiresToken0HookApproval || requiresToken1HookApproval;
    // console.log(`[useV4Approvals Check State Effect] Setting needsApprovalState to: ${newNeedsApproval}`); // Reduced verbosity
    setNeedsApprovalState(newNeedsApproval);

  }, [
    amount0, amount1, userAddress, positionManagerAddress, hookAddress,
    token0Address, token1Address, token0Decimals, token1Decimals,
    token0AllowanceHook_cached, token1AllowanceHook_cached, token0AllowanceManager_cached, token1AllowanceManager_cached,
    token0AllowanceHookLoading, token1AllowanceHookLoading, token0AllowanceManagerLoading, token1AllowanceManagerLoading
  ]);

  // --- Effect for Post-Confirmation --- 
  useEffect(() => {
    if (isApprovalConfirmed) {
      console.log('[useV4Approvals] Approval confirmed, refetching allowances...'); // Simplified log
      refetchToken0AllowanceHook();
      refetchToken1AllowanceHook();
      refetchToken0AllowanceManager();
      refetchToken1AllowanceManager();
    }
  }, [isApprovalConfirmed, refetchToken0AllowanceHook, refetchToken1AllowanceHook, refetchToken0AllowanceManager, refetchToken1AllowanceManager]);

  // --- Combined Error Handling --- 
  useEffect(() => {
    if (approveWriteError) {
      setInternalError(`Approval transaction failed: ${approveWriteError.message}`);
    } else if (confirmationError) {
      setInternalError(`Approval confirmation failed: ${confirmationError.message}`);
    } else {
      setInternalError(null);
    }
  }, [approveWriteError, confirmationError]);

  // --- Approve Function --- 
  const approve = useCallback(async () => {
    // console.log('[useV4Approvals Approve Fn] Triggered.'); // Reduced verbosity
    setInternalError(null);
    if (!userAddress || !positionManagerAddress || !token0Address || !token1Address || token0Decimals === undefined || token1Decimals === undefined || !amount0 || !amount1 || !publicClient) {
      const errorMsg = "[useV4Approvals Approve Fn] Missing required data for approval.";
      console.error(errorMsg, { userAddress, positionManagerAddress, token0Address, token1Address, token0Decimals, token1Decimals, amount0, amount1, publicClientExists: !!publicClient });
      setInternalError(errorMsg);
      return;
    }

    let token0Needed = BigInt(0);
    try { if (parseFloat(amount0) > 0) token0Needed = parseUnits(amount0, token0Decimals); } catch { console.warn('[useV4Approvals Approve Fn] Failed to parse amount0'); } 
    let token1Needed = BigInt(0);
    try { if (parseFloat(amount1) > 0) token1Needed = parseUnits(amount1, token1Decimals); } catch { console.warn('[useV4Approvals Approve Fn] Failed to parse amount1'); }

    // console.log(`[useV4Approvals Approve Fn] Amounts Needed: Token0=${token0Needed}, Token1=${token1Needed}`); // Reduced verbosity

    // --- Direct Allowance Check for BOTH Manager and Hook --- 
    // console.log('[useV4Approvals Approve Fn] Performing direct allowance fetch...'); // Reduced verbosity
    let currentToken0ManagerApproved = BigInt(0);
    let currentToken1ManagerApproved = BigInt(0);
    let currentToken0HookApproved = BigInt(0);
    let currentToken1HookApproved = BigInt(0);

    try {
      // Manager Allowances
      if (token0Needed > 0) {
        currentToken0ManagerApproved = await publicClient.readContract({ address: token0Address, abi: MockERC20Abi, functionName: 'allowance', args: [userAddress, positionManagerAddress] }) as bigint;
      }
      if (token1Needed > 0) {
        currentToken1ManagerApproved = await publicClient.readContract({ address: token1Address, abi: MockERC20Abi, functionName: 'allowance', args: [userAddress, positionManagerAddress] }) as bigint;
      }
      // Hook Allowances (if hook exists)
      if (hookAddress) {
         if (token0Needed > 0) {
            currentToken0HookApproved = await publicClient.readContract({ address: token0Address, abi: MockERC20Abi, functionName: 'allowance', args: [userAddress, hookAddress] }) as bigint;
         }
         if (token1Needed > 0) {
            currentToken1HookApproved = await publicClient.readContract({ address: token1Address, abi: MockERC20Abi, functionName: 'allowance', args: [userAddress, hookAddress] }) as bigint;
         }
      }
      // console.log(`[useV4Approvals Approve Fn] Direct Allowances: Manager0=${currentToken0ManagerApproved}, Manager1=${currentToken1ManagerApproved}, Hook0=${currentToken0HookApproved}, Hook1=${currentToken1HookApproved}`); // Reduced verbosity
    } catch (err: any) {
      console.error("[useV4Approvals Approve Fn] Error fetching allowances directly before approval:", err);
      setInternalError(`Failed to verify current allowance before sending approval: ${err.message}`);
      return;
    }
    // --- End Direct Check ---

    // Determine what needs approval based on DIRECT check
    const needsToken0ManagerApproval = token0Needed > 0 && currentToken0ManagerApproved < token0Needed;
    const needsToken1ManagerApproval = token1Needed > 0 && currentToken1ManagerApproved < token1Needed;
    const needsToken0HookApproval = !!hookAddress && token0Needed > 0 && currentToken0HookApproved < token0Needed;
    const needsToken1HookApproval = !!hookAddress && token1Needed > 0 && currentToken1HookApproved < token1Needed;
    
    // console.log(`[useV4Approvals Approve Fn] Needs Checks (Direct): Manager0=${needsToken0ManagerApproval}, Manager1=${needsToken1ManagerApproval}, Hook0=${needsToken0HookApproval}, Hook1=${needsToken1HookApproval}`); // Reduced verbosity

    let tokenToApprove: `0x${string}` | undefined;
    let spender: `0x${string}` | undefined;
    let tokenName = '';
    let spenderName = '';

    // --- Prioritize Approval: Manager first, then Hook --- 
    if (needsToken0ManagerApproval) {
      tokenToApprove = token0Address;
      spender = positionManagerAddress;
      tokenName = 'Token0 (USDC)';
      spenderName = 'Position Manager';
    } else if (needsToken1ManagerApproval) {
      tokenToApprove = token1Address;
      spender = positionManagerAddress;
      tokenName = 'Token1 (Outcome)';
      spenderName = 'Position Manager';
    } else if (needsToken0HookApproval) {
      tokenToApprove = token0Address;
      spender = hookAddress; // spender is hook address
      tokenName = 'Token0 (USDC)';
      spenderName = 'Hook';
    } else if (needsToken1HookApproval) {
      tokenToApprove = token1Address;
      spender = hookAddress; // spender is hook address
      tokenName = 'Token1 (Outcome)';
      spenderName = 'Hook';
    }

    if (tokenToApprove && spender) {
      console.log(`[useV4Approvals Approve Fn] Initiating approval for ${tokenName} to ${spenderName} (${spender})...`);
      try {
        approveWriteContract({ 
            address: tokenToApprove,
            abi: MockERC20Abi,
            functionName: 'approve',
            args: [spender, MAX_UINT256] // Approve the required spender
        });
        // console.log(`[useV4Approvals Approve Fn] Approval transaction sent (hash pending confirmation).`); // Reduced verbosity
      } catch (error: any) {
          console.error('[useV4Approvals Approve Fn] Error calling approveWriteContract:', error);
          setInternalError(`Failed to send approval transaction: ${error.message}`);
      }
    } else {
      console.log("[useV4Approvals Approve Fn] No Manager or Hook approval actually needed based on direct check. Refetching cached allowances.");
      // If no approval needed now, refetch state just in case
      refetchToken0AllowanceHook();
      refetchToken1AllowanceHook();
      refetchToken0AllowanceManager();
      refetchToken1AllowanceManager();
      // State will update via the needsApproval useEffect
    }
  }, [
    userAddress, positionManagerAddress, hookAddress, 
    token0Address, token1Address, 
    token0Decimals, token1Decimals,
    amount0, amount1,
    approveWriteContract, publicClient, // Added publicClient
    refetchToken0AllowanceHook, refetchToken1AllowanceHook,
    refetchToken0AllowanceManager, refetchToken1AllowanceManager,
  ]);

  const refetchAllowances = useCallback(() => {
    // console.log('[useV4Approvals] Manual refetchAllowances called.'); // Reduced verbosity
    refetchToken0AllowanceHook();
    refetchToken1AllowanceHook();
    refetchToken0AllowanceManager();
    refetchToken1AllowanceManager();
  }, [refetchToken0AllowanceHook, refetchToken1AllowanceHook, refetchToken0AllowanceManager, refetchToken1AllowanceManager]);

  return {
    needsApproval: needsApprovalState,
    isApproving: isApprovingWrite,
    isConfirming,
    approvalError: internalError,
    approve,
    refetchAllowances,
    approvalTxHash: approveTxHash
  };
} 