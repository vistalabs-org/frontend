export const AIOracleServiceManagerABI = [
  {
    inputs: [
      { name: "name", type: "string" }
    ],
    name: "createNewTask",
    outputs: [
      { 
        components: [
          { name: "name", type: "string" },
          { name: "taskCreatedBlock", type: "uint32" }
        ],
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "taskIndex", type: "uint32" }
    ],
    name: "taskStatus",
    outputs: [
      { name: "", type: "uint8" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "taskIndex", type: "uint32" }
    ],
    name: "taskRespondents",
    outputs: [
      { name: "", type: "address[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "taskIndex", type: "uint32" }
    ],
    name: "getConsensusResult",
    outputs: [
      { name: "result", type: "bytes" },
      { name: "isResolved", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "latestTaskNum",
    outputs: [
      { name: "", type: "uint32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "taskIndex", type: "uint32" },
      { name: "signature", type: "bytes" }
    ],
    name: "respondToTask",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "taskIndex", type: "uint32" }
    ],
    name: "distributeRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "taskIndex", type: "uint32" }
    ],
    name: "allTaskHashes",
    outputs: [
      { name: "", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "operator", type: "address" },
      { name: "taskIndex", type: "uint32" }
    ],
    name: "allTaskResponses",
    outputs: [
      { name: "", type: "bytes" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "taskIndex", type: "uint32" },
      { 
        components: [
          { name: "name", type: "string" },
          { name: "taskCreatedBlock", type: "uint32" }
        ],
        indexed: false, 
        name: "task", 
        type: "tuple" 
      }
    ],
    name: "NewTaskCreated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "taskIndex", type: "uint32" },
      { 
        components: [
          { name: "name", type: "string" },
          { name: "taskCreatedBlock", type: "uint32" }
        ],
        indexed: false, 
        name: "task", 
        type: "tuple" 
      },
      { indexed: true, name: "operator", type: "address" }
    ],
    name: "TaskResponded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "taskIndex", type: "uint32" },
      { indexed: false, name: "consensusResult", type: "bytes" }
    ],
    name: "ConsensusReached",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "agent", type: "address" },
      { indexed: true, name: "taskIndex", type: "uint32" },
      { indexed: false, name: "amount", type: "uint256" }
    ],
    name: "AgentRewarded",
    type: "event"
  }
];

export const AIAgentRegistryABI = [
  {
    inputs: [],
    name: "getAllAgents",
    outputs: [
      { name: "", type: "address[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "agent", type: "address" }
    ],
    name: "getAgentDetails",
    outputs: [
      { name: "modelType", type: "string" },
      { name: "modelVersion", type: "string" },
      { name: "tasksCompleted", type: "uint256" },
      { name: "consensusParticipations", type: "uint256" },
      { name: "rewardsEarned", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  }
];

export const AIAgentABI = [
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
  }
]; 