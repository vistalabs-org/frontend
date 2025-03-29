export const AIAgentRegistryABI = [
  {
    inputs: [
      { name: "_serviceManager", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [
      { name: "agent", type: "address" }
    ],
    name: "registerAgent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "agent", type: "address" }
    ],
    name: "unregisterAgent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "agent", type: "address" },
      { name: "status", type: "uint8" }
    ],
    name: "updateAgentStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
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
    inputs: [],
    name: "getAgentCount",
    outputs: [
      { name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "agent", type: "address" }
    ],
    name: "updateAgentStats",
    outputs: [],
    stateMutability: "nonpayable",
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
  },
  {
    inputs: [
      { name: "", type: "uint256" }
    ],
    name: "registeredAgents",
    outputs: [
      { name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "", type: "address" }
    ],
    name: "isRegistered",
    outputs: [
      { name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "", type: "address" }
    ],
    name: "agentModelTypes",
    outputs: [
      { name: "", type: "string" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "", type: "address" }
    ],
    name: "agentModelVersions",
    outputs: [
      { name: "", type: "string" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "", type: "address" }
    ],
    name: "agentTasksCompleted",
    outputs: [
      { name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "", type: "address" }
    ],
    name: "agentConsensusParticipations",
    outputs: [
      { name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "", type: "address" }
    ],
    name: "agentRewardsEarned",
    outputs: [
      { name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "agentAddress", type: "address" },
      { indexed: false, name: "modelType", type: "string" },
      { indexed: false, name: "modelVersion", type: "string" }
    ],
    name: "AgentRegistered",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "agentAddress", type: "address" }
    ],
    name: "AgentUnregistered",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "agentAddress", type: "address" },
      { indexed: false, name: "status", type: "uint8" }
    ],
    name: "AgentStatusUpdated",
    type: "event"
  }
]; 