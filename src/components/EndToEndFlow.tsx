// DEMO
"use client";
import SendUserOperationButton from "@/components/SendUserOperationButton";
import {
  useAuthModal,
  useLogout,
  useSignerStatus,
  useUser,
  useSmartAccountClient,
  useSendUserOperation
} from "@account-kit/react";

export default function EndToEndFlow() {
  const user = useUser();
  const { openAuthModal } = useAuthModal();
  const signerStatus = useSignerStatus();
  const { logout } = useLogout();
  const { client, address, isLoadingClient } = useSmartAccountClient({});

  const { sendUserOperation, isSendingUserOperation } = useSendUserOperation({
    client,
    // optional parameter that will wait for the transaction to be mined before returning
    waitForTxn: true,
    onSuccess: ({ hash, request }) => {
      // [optional] Do something with the hash and request
    },
    onError: (error) => {
      // [optional] Do something with the error
    },
  });

  return (
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md text-center">
        <h1 className="mb-6 text-2xl font-bold text-gray-800 text-center">End to End Flow</h1>
        
        {signerStatus.isInitializing ? (
          <div className="flex flex-col items-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: '#E82594', borderTopColor: 'transparent' }}></div>
            <p className="mt-4 text-gray-600">Loading your account...</p>
          </div>
        ) : user ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-pink-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="#E82594">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-gray-800">Success!</p>
            <p className="text-gray-600">
              Logged in as <span className="font-medium" style={{ color: '#E82594' }}>{user.email ?? "anon"}</span>
            </p>
            <button 
              className="btn btn-primary mt-6 w-full"
              onClick={() => logout()}
            >
              Log out
            </button>
            <div>
              <button
                onClick={() =>
                  sendUserOperation({
                    uo: {
                      target: "0xTARGET_ADDRESS",
                      data: "0x",
                      value: 0n,
                    },
                  })
                }
                disabled={isSendingUserOperation}
              >
                {isSendingUserOperation ? "Sending..." : "Send UO"}
              </button>
              <SendUserOperationButton
                client={client}
                targetAddress="0xANOTHER_TARGET"
                data="0x123456"
                value={1000000000000000n}
                className="btn btn-secondary w-full mt-2"
                onSuccess={({ hash }) => alert(`Transaction successful: ${hash}`)}
              >
                Send 0.001 ETH
              </SendUserOperationButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <p className="mb-6 text-gray-600">Please log in to access your account</p>
            <button 
              className="btn btn-primary w-full"
              onClick={openAuthModal}
            >
              Login
            </button>
          </div>
        )}
      </div>
  );
}
