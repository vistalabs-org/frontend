"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Helper components
const Badge = ({ children, color = 'green' }:any) => (
  <span className={`px-2 py-1 text-sm font-medium rounded-full ${
    color === 'green' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }`}>
    {children}
  </span>
);

const Card = ({ children, className = '' }:any) => (
  <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', onClick, className = '', disabled = false }:any) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variantClasses:any = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'border border-gray-300 text-gray-800 hover:bg-gray-100',
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

const PredictionMarketPage = ({ marketData = sampleMarketData }: any) => {
    const [selectedAction, setSelectedAction] = useState('Buy');
    const [selectedOption, setSelectedOption] = useState('Yes');
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState('Comments');

  const handleAmountChange = (e: { target: { value: string; }; }) => {
    // Only allow numeric input with decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const addAmount = (value: number) => {
    const currentAmount = parseFloat(amount) || 0;
    setAmount((currentAmount + value).toString());
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 text-gray-800">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Market Details */}
        <div className="lg:col-span-2">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex-shrink-0">
              {/* <Image 
                src={marketData.icon} 
                alt="Market icon" 
                width={64} 
                height={64} 
                className="rounded-lg"
              /> */}
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">{marketData.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>${marketData.volume.toLocaleString()} Vol.</span>
                <div className="flex items-center gap-1">
                  <svg 
                    className="w-4 h-4" 
                    fill="currentColor"
                    viewBox="0 0 512 512"
                  >
                    <path d="M256 48C141 48 48 141.2 48 256s93 208 207.8 208c115 0 208.2-93.2 208.2-208S370.8 48 255.8 48zm.2 374.4c-91.9 0-166.4-74.5-166.4-166.4S164.1 89.6 256 89.6 422.4 164.1 422.4 256 347.9 422.4 256 422.4z"/>
                    <path d="M266.4 152h-31.2v124.8l109.2 65.5 15.6-25.6-93.6-55.5V152z"/>
                  </svg>
                  <span>{marketData.endDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Chart */}
          <Card className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Yes</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{marketData.currentYesPrice}% chance</span>
                  <span className="text-red-500 flex items-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#EB5757">
                      <path d="m18.707 12.707l-1.414-1.414L13 15.586V6h-2v9.586l-4.293-4.293l-1.414 1.414L12 19.414z"/>
                    </svg>
                    {marketData.priceChange}%
                  </span>
                </div>
              </div>
              <div>
                {/* <img src="/polymarket-logo.svg" alt="Polymarket" className="h-8" /> */}
              </div>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-4 mb-4 h-64 flex items-center justify-center">
              <p className="text-gray-500">Chart visualization would go here</p>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {['1H', '6H', '1D', '1W', '1M', 'ALL'].map((period) => (
                  <Button 
                    key={period} 
                    variant={period === 'ALL' ? 'primary' : 'outline'} 
                    className="text-xs px-3 py-1"
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* Market Rules */}
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Rules</h2>
            <div className="prose max-w-none">
              <p className="mb-4">
                This market will resolve to "Yes" if the US Department of Education ceases operations entirely, including the termination of all federal educational programs managed by the department, by December 31, 2025, 11:59 PM ET. Otherwise, this market will resolve to "No".
              </p>
              <p className="mb-4">
                If the US Department of Education is merged with another agency, resulting in a consolidated department with a shared administrative structure which is no longer titled the Department of Education it will count as a "Yes" resolution.
              </p>
              <p className="mb-4">
                If it becomes impossible for Trump to sign legislation/perform executive actions (e.g. he resigns), this market will resolve to "No".
              </p>
              <p className="mb-4">
                The primary resolution source for this market will be official information from the US government, however a consensus of credible reporting will also be used.
              </p>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-4 mt-4">
              <div className="flex justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 6H11V20H9zM13 8H15V20H13zM17 4H19V20H17zM5 12H7V20H5z"></path>
                  </svg>
                  <span className="font-bold">Volume</span>
                  <span>${marketData.volume.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2C6.486,2,2,6.486,2,12s4.486,10,10,10s10-4.486,10-10S17.514,2,12,2z M12,20c-4.411,0-8-3.589-8-8s3.589-8,8-8 s8,3.589,8,8S16.411,20,12,20z"></path>
                    <path d="M13 7L11 7 11 12.414 14.293 15.707 15.707 14.293 13 11.586z"></path>
                  </svg>
                  <span className="font-bold">End Date</span>
                  <span>{marketData.endDate}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Comments */}
          <div className="mb-6">
            <div className="flex border-b">
              <button 
                className={`px-4 py-2 font-medium ${activeTab === 'Comments' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
                onClick={() => setActiveTab('Comments')}
              >
                Comments ({marketData.comments.length})
              </button>
              <button 
                className={`px-4 py-2 font-medium ${activeTab === 'TopHolders' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
                onClick={() => setActiveTab('TopHolders')}
              >
                Top Holders
              </button>
              <button 
                className={`px-4 py-2 font-medium ${activeTab === 'Activity' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
                onClick={() => setActiveTab('Activity')}
              >
                Activity
              </button>
              <button 
                className={`px-4 py-2 font-medium ${activeTab === 'Related' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
                onClick={() => setActiveTab('Related')}
              >
                Related
              </button>
            </div>
            
            <div className="py-4">
              <div className="mb-4">
                <input 
                  type="text" 
                  placeholder="Add a comment"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg mb-4 text-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20.995 6.9031C20.9789 6.73477 20.9203 6.57329 20.8246 6.43387C20.7289 6.29445 20.5993 6.18165 20.448 6.1061L12.475 2.1061C12.3363 2.03604 12.1832 1.99937 12.0278 1.99903C11.8724 1.99868 11.7191 2.03466 11.58 2.1041L3.55304 6.1041C3.25604 6.2541 3.05104 6.5411 3.00904 6.8711C2.99604 6.9681 1.86404 16.6121 11.55 21.8791C11.6989 21.9603 11.8661 22.0021 12.0357 22.0005C12.2053 21.999 12.3717 21.9541 12.519 21.8701C21.826 16.6111 21.033 7.2971 20.995 6.9031ZM12.018 19.8471C5.15804 15.8371 4.87804 9.4951 4.95504 7.6421L12.026 4.1191L19.024 7.6301C19.029 9.5001 18.543 15.8731 12.018 19.8471Z" fill="black"></path>
                </svg>
                <span>Beware of external links, they may be phishing attacks.</span>
              </div>
              
              {marketData.comments.slice(0, 5).map((comment:any, index:any) => (
                <div key={index} className="border-b py-4">
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
                        <div className="w-10 h-10 rounded-full bg-gray-300"></div>
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
                          <span className="text-gray-500 text-sm">{comment.time}</span>
                        </div>
                      </div>
                      <p className="mb-3">{comment.content}</p>
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 text-gray-500 text-sm">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 3.82916C9.09203 2.99424 7.90353 2.53086 6.67002 2.53082C6.01714 2.5315 5.37084 2.66129 4.76831 2.91271C4.16577 3.16414 3.61891 3.53223 3.15919 3.99582C1.19836 5.96499 1.19919 9.04499 3.16086 11.0058L9.27086 17.1158C9.41253 17.365 9.68586 17.5258 10 17.5258C10.129 17.5246 10.2559 17.4931 10.3706 17.4339C10.4852 17.3747 10.5843 17.2894 10.66 17.185L16.8392 11.0058C18.8009 9.04416 18.8009 5.96499 16.8375 3.99249C16.378 3.52975 15.8316 3.1624 15.2297 2.91156C14.6277 2.66071 13.9821 2.53132 13.33 2.53082C12.0965 2.53102 10.9081 2.99438 10 3.82916ZM15.6592 5.17082C16.9617 6.47999 16.9625 8.52499 15.6609 9.82749L10 15.4883L4.33919 9.82749C3.03752 8.52499 3.03836 6.47999 4.33752 5.17416C4.97086 4.54416 5.79919 4.19749 6.67002 4.19749C7.54086 4.19749 8.36586 4.54416 8.99419 5.17249L9.41086 5.58916C9.48818 5.66661 9.58002 5.72806 9.68111 5.76998C9.78221 5.81191 9.89058 5.83349 10 5.83349C10.1095 5.83349 10.2178 5.81191 10.3189 5.76998C10.42 5.72806 10.5119 5.66661 10.5892 5.58916L11.0059 5.17249C12.2659 3.91499 14.4009 3.91832 15.6592 5.17082Z" fill="#828282"></path>
                          </svg>
                          {comment.likes}
                        </button>
                        {comment.replies && comment.replies.length > 0 && (
                          <button className="text-blue-500 text-sm">
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

        {/* Right Column - Trading Widget */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <div className="mb-4">
              <div className="flex border rounded-lg overflow-hidden">
                <button 
                    className={`flex-1 py-2 font-medium border border-gray-300 ${selectedAction === 'Buy' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white'}`}
                    onClick={() => setSelectedAction('Buy')}
                    >
                    Buy
                </button>
                <button 
                    className={`flex-1 py-2 font-medium border border-gray-300 ${selectedAction === 'Sell' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white'}`}
                    onClick={() => setSelectedAction('Sell')}
                    >
                    Sell
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex border rounded-lg overflow-hidden">
                <button 
                  className={`flex-1 py-3 font-medium ${selectedOption === 'Yes' ? 'bg-green-500 text-white' : 'bg-white'}`}
                  onClick={() => setSelectedOption('Yes')}
                >
                  <div className="flex flex-col items-center">
                    <span>Yes</span>
                    <span className="text-sm">{marketData.currentYesPrice}¢</span>
                  </div>
                </button>
                <button 
                  className={`flex-1 py-3 font-medium ${selectedOption === 'No' ? 'bg-red-500 text-white' : 'bg-white'}`}
                  onClick={() => setSelectedOption('No')}
                >
                  <div className="flex flex-col items-center">
                    <span>No</span>
                    <span className="text-sm">{100 - marketData.currentYesPrice}¢</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <div className="relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.00"
                  value={amount}
                  onChange={handleAmountChange}
                />
              </div>
              
              <div className="flex gap-2 mt-2">
                <Button variant="outline" className="text-sm" onClick={() => addAmount(1)}>+$1</Button>
                <Button variant="outline" className="text-sm" onClick={() => addAmount(20)}>+$20</Button>
                <Button variant="outline" className="text-sm" onClick={() => addAmount(100)}>+$100</Button>
                <Button variant="outline" className="text-sm" onClick={() => setAmount('1000')}>Max</Button>
              </div>
            </div>

            <Button className="w-full mb-4">
              Login to Trade
            </Button>

            <p className="text-xs text-center text-gray-500">
              By trading, you agree to the <Link href="/tos" className="text-blue-500 underline">Terms of Use</Link>.
            </p>
          </Card>
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