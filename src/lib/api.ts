// lib/api.js

// Mock data for markets
const markets = [
    {
      id: 'trump-education-department-2025',
      title: "Will Trump end Department of Education in 2025?",
      icon: "", //"https://polymarket-upload.s3.us-east-2.amazonaws.com/will-trump-end-department-of-education-in-2025-j4a9cKlZWrVO.png",
      volume: 621853,
      endDate: "Dec 31, 2025",
      currentYesPrice: 17,
      priceChange: -17,
      description: "This market will resolve to \"Yes\" if the US Department of Education ceases operations entirely, including the termination of all federal educational programs managed by the department, by December 31, 2025, 11:59 PM ET. Otherwise, this market will resolve to \"No\".",
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
          avatar: "/avatars/user1.jpg",
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
        // Additional comments
      ],
      priceHistory: [
        { date: '2025-01-01', yesPrice: 10 },
        { date: '2025-01-15', yesPrice: 12 },
        { date: '2025-02-01', yesPrice: 15 },
        { date: '2025-02-15', yesPrice: 18 },
        { date: '2025-03-01', yesPrice: 22 },
        { date: '2025-03-15', yesPrice: 19 },
        { date: '2025-04-01', yesPrice: 21 },
        { date: '2025-04-15', yesPrice: 25 },
        { date: '2025-05-01', yesPrice: 23 },
        { date: '2025-05-15', yesPrice: 26 },
        { date: '2025-06-01', yesPrice: 28 },
        { date: '2025-06-15', yesPrice: 24 },
        { date: '2025-07-01', yesPrice: 22 },
        { date: '2025-07-15', yesPrice: 20 },
        { date: '2025-08-01', yesPrice: 18 },
        { date: '2025-08-15', yesPrice: 15 },
        { date: '2025-09-01', yesPrice: 17 },
      ]
    },
    {
      id: 'trump-first-100-days',
      title: "Will Trump fulfill his key promises in the first 100 days?",
      icon: "https://example.com/trump-100-days.png",
      volume: 987654,
      endDate: "Apr 30, 2025",
      currentYesPrice: 42,
      priceChange: 5,
      // Additional data...
    },
    {
      id: 'republican-house-majority',
      title: "Will Republicans maintain House majority throughout 2025?",
      icon: "https://example.com/republican-house.png",
      volume: 543210,
      endDate: "Dec 31, 2025",
      currentYesPrice: 78,
      priceChange: 3,
      // Additional data...
    }
  ];
  
  // Function to get all markets
  export const getMarkets = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return markets; 
  };
  
  // Function to get a specific market by ID
  export const getMarketData = async (id: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if id is a number (or can be parsed as one)
    const numericId = parseInt(id, 10);
    
    // If it's a valid number and within range, return market by index
    if (!isNaN(numericId) && numericId >= 0 && numericId < markets.length) {
      return markets[numericId];
    }
    
    // Otherwise try to find by string ID
    const market = markets.find(m => m.id === id);
    
    if (!market) {
      console.error(`Market not found for ID: ${id}`);
      throw new Error('Market not found');
    }
    
    return market;
  };
  
  // Function to get trending markets
  export const getTrendingMarkets = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Sort by volume to get "trending" markets
    return [...markets].sort((a, b) => b.volume - a.volume).slice(0, 3);
  };
  
  // Function to simulate placing a trade
  export const placeTrade = async (marketId: any, tradeType: any, amount: any) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would interact with a blockchain or backend
    return {
      success: true,
      transaction: {
        id: 'tx_' + Math.random().toString(36).substring(2, 15),
        marketId,
        tradeType,
        amount,
        timestamp: new Date().toISOString()
      }
    };
  };