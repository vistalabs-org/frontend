export const AIAgentABI = [
  {
    inputs: [
      { name: "_serviceManager", type: "address" },
      { name: "_modelType", type: "string" },
      { name: "_modelVersion", type: "string" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [
      { name: "_status", type: "uint8" }
    ],
    name: "setStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "_modelType", type: "string" },
      { name: "_modelVersion", type: "string" }
    ],
    name: "updateModelInfo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "taskIndex", type: "uint32" },
      { name: "signature", type: "bytes" }
    ],
    name: "processTask",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "taskIndex", type: "uint32" }
    ],
    name: "recordReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getAgentStats",
    outputs: [
      { name: "_tasksCompleted", type: "uint256" },
      { name: "_consensusParticipations", type: "uint256" },
      { name: "_totalRewards", type: "uint256" },
      { name: "_currentStatus", type: "uint8" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "modelType",
    outputs: [
      { name: "", type: "string" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "modelVersion",
    outputs: [
      { name: "", type: "string" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "status",
    outputs: [
      { name: "", type: "uint8" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "tasksCompleted",
    outputs: [
      { name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "consensusParticipations",
    outputs: [
      { name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalRewardsEarned",
    outputs: [
      { name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "serviceManager",
    outputs: [
      { name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "taskIndex", type: "uint32" },
      { indexed: false, name: "signature", type: "bytes" }
    ],
    name: "TaskProcessed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "oldStatus", type: "uint8" },
      { indexed: false, name: "newStatus", type: "uint8" }
    ],
    name: "StatusChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: true, name: "taskIndex", type: "uint32" }
    ],
    name: "RewardReceived",
    type: "event"
  }
]; 