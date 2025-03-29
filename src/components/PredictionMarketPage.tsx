"use client"
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import SwapFunction from './SwapFunction';
import { useAccount } from 'wagmi';
import { parseUnits } from 'ethers';
import { MockERC20Abi } from '@/contracts/MockERC20_abi';
import { ROUTER } from '@/app/constants';

// Helper components
const Badge = ({ children, color = 'green' }:any) => (
  <span className={`px-2 py-1 text-sm font-medium rounded-full ${
    color === 'green' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }`}>
    {children}
  </span>
);

const Card = ({ children, className = '' }:any) => (
  <div className={`market-card ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', onClick, className = '', disabled = false }:any) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variantClasses:any = {
    primary: 'banner-button',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'border border-border-color text-secondary hover:bg-opacity-10',
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// First, add a TokenBalances component
const TokenBalances = ({ collateralBalance, yesBalance, noBalance }: { 
  collateralBalance?: string;
  yesBalance?: string;
  noBalance?: string;
}) => {
  return (
    <div className="mt-4 p-4 border-t border-border-color">
      <h3 className="text-sm font-medium mb-2">Your Balances</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-secondary">USDC:</span>
          <span>{collateralBalance || '0.00'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-secondary">Yes Tokens:</span>
          <span>{yesBalance || '0.00'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-secondary">No Tokens:</span>
          <span>{noBalance || '0.00'}</span>
        </div>
      </div>
    </div>
  );
};

// Add this new component for the price display
const PriceDisplay = ({ yesPrice, yesPercentage }: { yesPrice: string; yesPercentage: number }) => {
  const noPercentage = 100 - yesPercentage;
  
  return (
    <div className="price-display p-8 text-center">
      <div className="flex justify-between items-center mb-6">
        <div className="text-center flex-1">
          <div className="text-4xl font-bold mb-2">{yesPercentage.toFixed(1)}%</div>
          <div className="text-sm text-secondary">Yes</div>
        </div>
        <div className="text-2xl text-secondary px-4">vs</div>
        <div className="text-center flex-1">
          <div className="text-4xl font-bold mb-2">{noPercentage.toFixed(1)}%</div>
          <div className="text-sm text-secondary">No</div>
        </div>
      </div>
      <div className="text-sm text-secondary">
        Current Market Price
      </div>
    </div>
  );
};

const PredictionMarketPage = ({ 
  marketData, 
  yesPool, 
  noPool, 
  yesPrice, 
  yesPercentage, 
  description, 
  endTimestamp, 
  marketId,
  mintCollateralButton
}: any) => {
    const [selectedAction, setSelectedAction] = React.useState('Buy');
    const [selectedOption, setSelectedOption] = React.useState('Yes');
  const [amount, setAmount] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('Comments');
  const { isConnected } = useAccount();

  // Use the SwapFunction hook
  const { 
    handleSwap, 
    isSwapping, 
    expectedOutput, 
    tokenBalance,
    needsApproval,
    handleApprove,
    isApproving,
    isApproved
  } = SwapFunction({
    marketId,
    yesPool,
    noPool,
    market: marketData,
    selectedAction: selectedAction as 'Buy' | 'Sell',
    selectedOption: selectedOption as 'Yes' | 'No',
    amount,
    setAmount
  });

  const handleAmountChange = (e: { target: { value: string; }; }) => {
    // Only allow numeric input with decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const addAmount = (value: number) => {
    const currentAmount = parseFloat(amount) || 0;
    setAmount((currentAmount + value).toString());
  };

  // Add checks for all required properties
  const volume = marketData?.volume ? marketData.volume.toLocaleString() : '0';
  const comments = marketData?.comments || [];
  const topHolders = marketData?.topHolders || [];
  const activity = marketData?.activity || [];

  const formatEndDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return format(date, "MMMM d, yyyy 'at' h:mm a");
  };

  return (
    <div className="max-w-screen-xl mx-auto py-6 text-primary">
      <div className="flex flex-col gap-6">
        {/* Oracle Box - match Rules section style */}
        <div className="px-6">
          <div className="rounded-lg bg-[#1E2631] p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-white text-base font-medium mb-1">Powered by AI Oracle</h2>
                <p className="text-[#8896A7] text-sm">This market will be resolved using our decentralized AI oracle system</p>
              </div>
              <button className="text-[#5AA1E9] hover:text-[#7AB5F2] text-sm">See How It Works</button>
            </div>
          </div>
        </div>

        {/* Main content area with market price and swap box */}
        <div className="px-6 flex gap-6">
          {/* Left column - Market price */}
          <div className="flex-1">
            <div className="rounded-lg bg-card-background p-4">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="market-icon-container" style={{ width: '64px', height: '64px' }}>
                    {marketData.icon ? (
                      <Image 
                        src={marketData.icon} 
                        alt="Market icon" 
                        width={64} 
                        height={64} 
                        className="rounded-lg"
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--border-light)' }}></div>
                    )}
                  </div>
                </div>
                <div>
                  <h1 className="market-title text-2xl mb-2">{marketData.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-secondary">
                    <span>${volume} Vol.</span>
                    <div className="flex items-center gap-1">
                      <svg 
                        className="w-4 h-4" 
                        fill="currentColor"
                        viewBox="0 0 512 512"
                      >
                        <path d="M256 48C141 48 48 141.2 48 256s93 208 207.8 208c115 0 208.2-93.2 208.2-208S370.8 48 255.8 48zm.2 374.4c-91.9 0-166.4-74.5-166.4-166.4S164.1 89.6 256 89.6 422.4 164.1 422.4 256 347.9 422.4 256 422.4z"/>
                        <path d="M266.4 152h-31.2v124.8l109.2 65.5 15.6-25.6-93.6-55.5V152z"/>
                      </svg>
                      <span>{endTimestamp ? formatEndDate(Number(endTimestamp)) : "Loading..."}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Chart */}
              <Card className="mb-6">
                <PriceDisplay 
                  yesPrice={yesPrice} 
                  yesPercentage={yesPercentage} 
                />
              </Card>

              {/* Market Rules */}
              <Card className="mb-6">
                <div className="market-header">
                  <h2 className="market-title">Rules</h2>
                </div>
                
                <div className="market-content">
                  <div className="prose max-w-none text-secondary">
                    <p className="mb-4">{description || "Loading..."}</p>
                    <p className="mb-4">
                      <span className="font-semibold">Resolution Date:</span>{' '}
                      {endTimestamp ? formatEndDate(Number(endTimestamp)) : "Loading..."}
                    </p>
                  </div>
                  
                  <div className="bg-card-background rounded-lg p-4 mt-4" style={{ backgroundColor: 'var(--card-background)' }}>
                    <div className="flex justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 6H11V20H9zM13 8H15V20H13zM17 4H19V20H17zM5 12H7V20H5z"></path>
                        </svg>
                        <span className="font-bold">Volume</span>
                        <span>${volume}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,2C6.486,2,2,6.486,2,12s4.486,10,10,10s10-4.486,10-10S17.514,2,12,2z M12,20c-4.411,0-8-3.589-8-8s3.589-8,8-8 s8,3.589,8,8S16.411,20,12,20z"></path>
                          <path d="M13 7L11 7 11 12.414 14.293 15.707 15.707 14.293 13 11.586z"></path>
                        </svg>
                        <span className="font-bold">End Date</span>
                        <span>{endTimestamp ? formatEndDate(Number(endTimestamp)) : "Loading..."}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Comments */}
              <div className="market-card mb-6">
                <div className="market-tabs">
                  <button 
                    className={`tab-button ${activeTab === 'Comments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Comments')}
                  >
                    Comments ({comments.length})
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'TopHolders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('TopHolders')}
                  >
                    Top Holders ({topHolders.length})
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'Activity' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Activity')}
                  >
                    Activity ({activity.length})
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'Related' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Related')}
                  >
                    Related
                  </button>
                </div>
                
                <div className="market-content py-4">
                  <div className="mb-4">
                    <input 
                      type="text" 
                      placeholder="Add a comment"
                      className="w-full p-3 border border-border-color rounded-lg bg-card-background"
                      style={{ backgroundColor: 'var(--card-background)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 rounded-lg mb-4 text-sm" style={{ backgroundColor: 'var(--card-background)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--text-secondary)">
                      <path d="M20.995 6.9031C20.9789 6.73477 20.9203 6.57329 20.8246 6.43387C20.7289 6.29445 20.5993 6.18165 20.448 6.1061L12.475 2.1061C12.3363 2.03604 12.1832 1.99937 12.0278 1.99903C11.8724 1.99868 11.7191 2.03466 11.58 2.1041L3.55304 6.1041C3.25604 6.2541 3.05104 6.5411 3.00904 6.8711C2.99604 6.9681 1.86404 16.6121 11.55 21.8791C11.6989 21.9603 11.8661 22.0021 12.0357 22.0005C12.2053 21.999 12.3717 21.9541 12.519 21.8701C21.826 16.6111 21.033 7.2971 20.995 6.9031ZM12.018 19.8471C5.15804 15.8371 4.87804 9.4951 4.95504 7.6421L12.026 4.1191L19.024 7.6301C19.029 9.5001 18.543 15.8731 12.018 19.8471Z" fill="var(--text-secondary)"></path>
                    </svg>
                    <span className="text-secondary">Beware of external links, they may be phishing attacks.</span>
                  </div>
                  
                  {comments.slice(0, 5).map((comment:any, index:any) => (
                    <div key={index} className="border-b border-border-color py-4" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          {comment.avatar ? (
                            <Image 
                              src={comment.avatar} 
                              alt={comment.username} 
                              width={40} 
                              height={40} 
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}></div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{comment.username}</span>
                              {comment.position && (
                                <Badge color={comment.position.includes('Yes') ? 'green' : 'red'}>
                                  {comment.position}
                                </Badge>
                              )}
                              <span className="text-secondary text-sm">{comment.time}</span>
                            </div>
                          </div>
                          <p className="mb-3 text-secondary">{comment.content}</p>
                          <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1 text-secondary text-sm">
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--text-secondary)">
                                <path d="M10 3.82916C9.09203 2.99424 7.90353 2.53086 6.67002 2.53082C6.01714 2.5315 5.37084 2.66129 4.76831 2.91271C4.16577 3.16414 3.61891 3.53223 3.15919 3.99582C1.19836 5.96499 1.19919 9.04499 3.16086 11.0058L9.27086 17.1158C9.41253 17.365 9.68586 17.5258 10 17.5258C10.129 17.5246 10.2559 17.4931 10.3706 17.4339C10.4852 17.3747 10.5843 17.2894 10.66 17.185L16.8392 11.0058C18.8009 9.04416 18.8009 5.96499 16.8375 3.99249C16.378 3.52975 15.8316 3.1624 15.2297 2.91156C14.6277 2.66071 13.9821 2.53132 13.33 2.53082C12.0965 2.53102 10.9081 2.99438 10 3.82916ZM15.6592 5.17082C16.9617 6.47999 16.9625 8.52499 15.6609 9.82749L10 15.4883L4.33919 9.82749C3.03752 8.52499 3.03836 6.47999 4.33752 5.17416C4.97086 4.54416 5.79919 4.19749 6.67002 4.19749C7.54086 4.19749 8.36586 4.54416 8.99419 5.17249L9.41086 5.58916C9.48818 5.66661 9.58002 5.72806 9.68111 5.76998C9.78221 5.81191 9.89058 5.83349 10 5.83349C10.1095 5.83349 10.2178 5.81191 10.3189 5.76998C10.42 5.72806 10.5119 5.66661 10.5892 5.58916L11.0059 5.17249C12.2659 3.91499 14.4009 3.91832 15.6592 5.17082Z" fill="var(--text-secondary)"></path>
                              </svg>
                              {comment.likes}
                            </button>
                            {comment.replies && comment.replies.length > 0 && (
                              <button className="text-sm" style={{ color: 'var(--primary-color)' }}>
                                {comment.showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'Reply' : 'Replies'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Swap box */}
          <div className="w-[400px]">
            <div className="rounded-lg bg-card-background p-4">
              <div className="market-content">
                <div className="mb-4">
                  <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                    <button 
                        className={`flex-1 py-2 font-medium ${selectedAction === 'Buy' ? 'bg-primary-color text-white' : 'bg-card-background text-secondary'}`}
                        style={{ backgroundColor: selectedAction === 'Buy' ? 'var(--primary-color)' : 'var(--card-background)' }}
                        onClick={() => setSelectedAction('Buy')}
                        >
                        Buy
                    </button>
                    <button 
                        className={`flex-1 py-2 font-medium ${selectedAction === 'Sell' ? 'bg-primary-color text-white' : 'bg-card-background text-secondary'}`}
                        style={{ backgroundColor: selectedAction === 'Sell' ? 'var(--primary-color)' : 'var(--card-background)' }}
                        onClick={() => setSelectedAction('Sell')}
                        >
                        Sell
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                    <button 
                      className={`flex-1 py-3 font-medium ${selectedOption === 'Yes' ? 'bg-green text-white' : 'bg-card-background text-secondary'}`}
                      style={{ backgroundColor: selectedOption === 'Yes' ? 'var(--green)' : 'var(--card-background)' }}
                      onClick={() => setSelectedOption('Yes')}
                    >
                      <div className="flex flex-col items-center">
                        <span>Yes</span>
                      </div>
                    </button>
                    <button 
                      className={`flex-1 py-3 font-medium ${selectedOption === 'No' ? 'bg-red text-white' : 'bg-card-background text-secondary'}`}
                      style={{ backgroundColor: selectedOption === 'No' ? 'var(--red)' : 'var(--card-background)' }}
                      onClick={() => setSelectedOption('No')}
                    >
                      <div className="flex flex-col items-center">
                        <span>No</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Amount
                  </label>
                  <div className="relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-secondary sm:text-sm">$</span>
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-7 pr-12 sm:text-sm border-border-color rounded-md bg-card-background text-primary"
                      style={{ backgroundColor: 'var(--card-background)', borderColor: 'var(--border-color)' }}
                      placeholder="0.00"
                      value={amount}
                      onChange={handleAmountChange}
                    />
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" className="text-sm" onClick={() => addAmount(1)}>+$1</Button>
                    <Button variant="outline" className="text-sm" onClick={() => addAmount(20)}>+$20</Button>
                    <Button variant="outline" className="text-sm" onClick={() => addAmount(100)}>+$100</Button>
                    <Button variant="outline" className="text-sm" onClick={() => setAmount(tokenBalance)}>Max</Button>
                  </div>
                  
                  {/* Add expected output display */}
                  {amount && parseFloat(amount) > 0 && (
                    <div className="mt-2 text-sm text-secondary">
                      Expected {selectedAction === 'Buy' ? 'output' : 'return'}: 
                      {selectedAction === 'Buy' 
                        ? ` ${expectedOutput} ${selectedOption} tokens` 
                        : ` $${expectedOutput}`}
                    </div>
                  )}
                </div>

                {isConnected ? (
                  needsApproval && !isApproved ? (
                    <button 
                      className="banner-button w-full mb-4" 
                      style={{ backgroundColor: 'var(--primary-color)' }}
                      onClick={() => handleApprove({
                        address: selectedAction === 'Buy' 
                          ? marketData?.collateralAddress 
                          : selectedOption === 'Yes' 
                            ? marketData?.yesToken 
                            : marketData?.noToken,
                        abi: MockERC20Abi,
                        functionName: 'approve',
                        args: [ROUTER, parseUnits('1000000', selectedAction === 'Buy' ? 6 : 18)],
                      })}
                      disabled={isApproving}
                    >
                      {isApproving ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Approving...
                        </span>
                      ) : `Approve ${selectedAction === 'Buy' ? 'USDC' : selectedOption}`}
                    </button>
                  ) : (
                    <button 
                      className="banner-button w-full mb-4" 
                      style={{ backgroundColor: 'var(--primary-color)' }}
                      onClick={handleSwap}
                      disabled={isSwapping || !amount || parseFloat(amount) <= 0}
                    >
                      {isSwapping ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : `${selectedAction} ${selectedOption}`}
                    </button>
                  )
                ) : (
                  <button className="banner-button w-full mb-4" style={{ backgroundColor: 'var(--primary-color)' }}>
                    Connect Wallet to Trade
                  </button>
                )}

                {/* Show approval success message */}
                {isApproved && (
                  <div className="mb-4 p-2 bg-green-800 bg-opacity-20 text-green-400 rounded text-sm text-center">
                    Token approval successful! You can now trade.
                  </div>
                )}

                <p className="text-xs text-center text-secondary">
                  By trading, you agree to the <Link href="/tos" className="text-primary-color underline" style={{ color: 'var(--primary-color)' }}>Terms of Use</Link>.
                </p>

                {/* Add mint button right after the swap content */}
                {mintCollateralButton}

                {/* Add token balances below mint button */}
                {isConnected && (
                  <TokenBalances 
                    collateralBalance={tokenBalance}
                    yesBalance={yesPool?.balance}
                    noBalance={noPool?.balance}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sample data for demonstration
const sampleMarketData = {
  title: "Will Trump end Department of Education in 2025?",
  icon: "/market-icon.png",
  volume: 621853,
  endDate: "Dec 31, 2025",
  currentYesPrice: 17,
  priceChange: 17,
  comments: [
    {
      username: "thakattack19",
      avatar: null,
      time: "6h ago",
      content: "orange lard can't end a department without congressional approval. No way 60 votes.",
      likes: 1,
      position: null,
    },
    {
      username: "CtrlAltHandsome",
      avatar: "/user1.jpg",
      time: "2d ago",
      content: "why isnt this resolved yet?",
      likes: 2,
      position: "211 Yes",
      replies: [
        {
          username: "username3",
          content: "The executive order doesn't eliminate the department completely, just starts the process."
        }
      ],
      showReplies: false
    },
    {
      username: "vughtzuid",
      avatar: "/user2.jpg",
      time: "2d ago",
      content: "Sounds like a good bet to me, even if the retarded orange monkey does not actually succeed in the end he'll cause plenty of doubt that he might",
      likes: 0,
      position: "50 Yes",
      replies: [
        {
          username: "Icetea2",
          content: "You're so scared that people might take you as a Republican when you bet on Trump that you have to specify \"retarded orange monkey\" in every single post of yours lmao"
        }
      ],
      showReplies: false
    },
    {
      username: "duderr",
      avatar: "/user3.jpg",
      time: "2d ago",
      content: "damn am i cooked?",
      likes: 0,
      position: "200 No",
      replies: [
        {
          username: "anonusergfbf",
          content: "currently, you are winning - don't know why - Trump just signed the executive order."
        }
      ],
      showReplies: false
    },
    {
      username: "OneT",
      avatar: null,
      time: "2d ago",
      content: "TRUMP TO SIGN ACTION ENDING EDUCATION DEPT. ON THURS: USA TODAY",
      likes: 0,
      position: null,
    }
  ]
};

export default PredictionMarketPage;