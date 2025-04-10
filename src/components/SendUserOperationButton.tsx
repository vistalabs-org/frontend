"use client";

import { useSendUserOperation } from "@account-kit/react";
import { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Define props interface (inheriting Button props might be complex due to ref forwarding)
// It's often simpler to define specific props and pass them down.
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
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null; // Allow passing variant
  size?: "default" | "sm" | "lg" | "icon" | null; // Allow passing size
}

/**
 * A reusable button component for sending user operations using Shadcn UI Button
 * 
 * @param {Object} props - The component props
 * @param {Object} props.client - The smart account client
 * @param {string} props.targetAddress - The target address for the operation
 * @param {string} props.data - The data for the operation (defaults to "0x")
 * @param {bigint|number} props.value - The value to send (defaults to 0n)
 * @param {boolean} props.waitForTxn - Whether to wait for the transaction (defaults to true)
 * @param {Function} props.onSuccess - Callback for successful operations
 * @param {Function} props.onError - Callback for operation errors
 * @param {string} props.className - Additional CSS classes to pass to Shadcn Button
 * @param {React.ReactNode} props.children - Button text or content
 * @param {boolean} props.disabled - Explicitly disable the button
 * @param {string} props.variant - Shadcn Button variant
 * @param {string} props.size - Shadcn Button size
 */
export default function SendUserOperationButton({
  client,
  targetAddress,
  data = "0x",
  value = 0n,
  waitForTxn = true,
  onSuccess,
  onError,
  className,
  children = "Send User Operation", // Default text
  disabled = false,
  variant = "default", // Default variant
  size,
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
    <Button
      variant={variant}
      size={size}
      className={className} // Pass className to Shadcn Button
      onClick={handleSendUserOperation}
      disabled={isSendingUserOperation || disabled || !client}
    >
      {isSendingUserOperation ? (
        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
      ) : (
        children
      )}
    </Button>
  );
}