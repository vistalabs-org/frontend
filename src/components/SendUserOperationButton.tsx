"use client";

import { useSendUserOperation } from "@account-kit/react";
import { ButtonHTMLAttributes, ReactNode } from "react";

  // Define props interface
  interface SendUserOperationButtonProps {
    client: any; // Ideally use SmartAccountClient type from @account-kit/react
    targetAddress: string;
    data?: string;
    value?: bigint | number;
    waitForTxn?: boolean;
    onSuccess?: (result: any) => void;
    onError?: (error: Error) => void;
    className?: string;
    children?: ReactNode;
    disabled?: boolean;
  }

/**
 * A reusable button component for sending user operations
 * 
 * @param {Object} props - The component props
 * @param {Object} props.client - The smart account client
 * @param {string} props.targetAddress - The target address for the operation
 * @param {string} props.data - The data for the operation (defaults to "0x")
 * @param {bigint|number} props.value - The value to send (defaults to 0n)
 * @param {boolean} props.waitForTxn - Whether to wait for the transaction (defaults to true)
 * @param {Function} props.onSuccess - Callback for successful operations
 * @param {Function} props.onError - Callback for operation errors
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button text or content
 */
export default function SendUserOperationButton({
  client,
  targetAddress,
  data = "0x",
  value = 0n,
  waitForTxn = true,
  onSuccess,
  onError,
  className = "",
  children = "Send UO",
  disabled = false,
  ...rest
}: SendUserOperationButtonProps) {
  const { sendUserOperation, isSendingUserOperation } = useSendUserOperation({
    client,
    waitForTxn,
    onSuccess: onSuccess || (({ hash, request }) => {
      console.log("Transaction successful:", hash, request);
    }),
    onError: onError || ((error) => {
      console.error("Transaction failed:", error);
    }),
  });

  const handleSendUserOperation = () => {
    // Ensure targetAddress starts with 0x
    const formattedTarget = targetAddress.startsWith('0x') 
      ? targetAddress as `0x${string}` 
      : `0x${targetAddress}` as `0x${string}`;

    // Ensure data starts with 0x
    const formattedData = data.startsWith('0x') 
      ? data as `0x${string}` 
      : `0x${data}` as `0x${string}`;

    sendUserOperation({
      uo: {
        target: formattedTarget,
        data: formattedData,
        value: typeof value === 'number' ? BigInt(value) : value,
      },
    });
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg ${isSendingUserOperation ? 'bg-gray-300' : 'bg-pink-600 hover:bg-pink-700'} text-white transition-colors ${className}`}
      onClick={handleSendUserOperation}
      disabled={isSendingUserOperation || disabled || !client}
      {...rest}
    >
      {isSendingUserOperation ? "Sending..." : children}
    </button>
  );
}