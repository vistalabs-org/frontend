import { useState } from 'react';
import { ExternalLink, HelpCircle, CheckCircle } from 'lucide-react';
import { MintCollateralButton } from './MintCollateralButton';
import { useAccount } from 'wagmi';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useMintCollateral } from '@/hooks/useMintCollateral';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

// Using the same test USDC address used in the application
const TEST_USDC_ADDRESS = "0xA5a2250b0170bdb9bd0904C0440717f00A506023";

export default function HowItWorksOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected } = useAccount();
  const [mintSuccess, setMintSuccess] = useState(false);

  // Function to handle mint success
  const handleMintSuccess = () => {
    setMintSuccess(true);
    
    // Reset success message after 5 seconds
    setTimeout(() => {
      setMintSuccess(false);
    }, 5000);
  };

  return (
    <>
      {/* Button to open the overlay */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
      >
        <HelpCircle className="h-4 w-4 mr-1" />
        How it Works
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative p-8 bg-background rounded-lg shadow-xl max-w-md border border-border overflow-y-auto max-h-[90vh]">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">How Vista Market Works</h2>
              
              <div>
                <h3 className="font-medium mb-2">Decision Markets</h3>
                <p className="text-sm text-muted-foreground">
                  Vista Market is a prediction market for governance proposals where users can:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Create decision markets based on target KPIs (e.g. on-chain activity, on-chain revenue, etc.) or token price</li>
                  <li>Trade governance outcomes</li>
                  <li>Resolve markets using AI oracle consensus</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Get Started</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  To start trading, you'll need some test USDC. Mint some tokens below:
                </p>
                
                {mintSuccess && (
                  <Alert className="mb-4 bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>
                      Tokens have been successfully minted to your wallet.
                    </AlertDescription>
                  </Alert>
                )}
                
                {isConnected ? (
                  <div className="p-4 border rounded-md bg-muted/30">
                    <CustomMintButton 
                      collateralAddress={TEST_USDC_ADDRESS as `0x${string}`}
                      onSuccess={handleMintSuccess}
                    />
                  </div>
                ) : (
                  <div className="p-4 border rounded-md bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Connect your wallet to mint test tokens</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                    >
                      Close and Connect Wallet
                    </Button>
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-2">
                <a 
                  href="https://verbena-lifeboat-b0e.notion.site/vista-labs-1c25a32af0b580ae8caff87008bb16e7" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Read the Documentation
                </a>
                <a 
                  href="https://www.loom.com/share/14eebc7c6f0e4312b68431ae8b6d0189?sid=a2c7cb1b-561d-4b94-bd16-6d3a498c0296" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Watch the Explainer Video
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Extended MintCollateralButton with success callback
function CustomMintButton({ collateralAddress, onSuccess }: { 
  collateralAddress: `0x${string}`;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const { mint, isMinting, isClientReady } = useMintCollateral();
  const [error, setError] = useState<string | null>(null);

  const handleMint = async () => {
    try {
      setError(null);
      if (!isClientReady) {
        setError("Smart account client not ready. Please try again.");
        return;
      }
      
      // Wait for the transaction to be mined
      const hash = await mint(collateralAddress, amount);
      
      // Clear input and trigger success callback
      setAmount(''); 
      onSuccess();
    } catch (error) {
      console.error('Failed to mint:', error);
      setError(error instanceof Error ? error.message : "Failed to mint tokens");
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          value={amount}
          onChange={(e) => {
            setError(null);
            const value = e.target.value.replace(/[^0-9.]/g, '');
            if (/^\d*\.?\d*$/.test(value)) {
              setAmount(value);
            }
          }}
          placeholder="Amount to mint"
          className="flex-1"
          disabled={isMinting}
        />
        <Button
          onClick={handleMint}
          disabled={isMinting || !amount || !isClientReady}
        >
          {isMinting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Minting...</>
          ) : (
            'Mint'
          )}
        </Button>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
      
      {!isClientReady && (
        <p className="mt-2 text-sm text-muted-foreground">
          Initializing wallet connection...
        </p>
      )}
    </div>
  );
} 