"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMarketByIndex } from '@/hooks/fetchMarkets';
import { useOracleTask, useCreateTask, useRegisteredAgents } from '@/hooks/useOracleData';
import Link from 'next/link';

// Helper function to convert task status number to string
const getStatusString = (status: number): string => {
  switch (status) {
    case 0: return "Created";
    case 1: return "In Progress";
    case 2: return "Resolved";
    default: return "Unknown";
  }
};

// Helper function to get agent status string
const getAgentStatusString = (status: number): string => {
  switch (status) {
    case 0: return "Inactive";
    case 1: return "Active";
    case 2: return "Suspended";
    default: return "Unknown";
  }
};

// Helper function to get status color
const getStatusColor = (status: number): string => {
  switch (status) {
    case 0: return "var(--primary-color)";
    case 1: return "var(--primary-color)";
    case 2: return "var(--green)";
    default: return "var(--text-secondary)";
  }
};

// Type definitions
interface TaskData {
  id: number;
  status: number;
  respondents: string[];
  consensusResult: {
    result: string;
    isResolved: boolean;
  };
}

interface AgentData {
  address: string;
  modelType: string;
  modelVersion: string;
  tasksCompleted: number;
  consensusParticipations: number;
  rewardsEarned: number;
  status: number;
}

export default function MarketResolutionClient() {
  const params = useParams();
  const router = useRouter();
  const marketId = typeof params.id === 'string' ? params.id : '';
  
  const [taskId, setTaskId] = useState<number | undefined>(undefined);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'process'>('overview');
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [showAgentDetails, setShowAgentDetails] = useState(false);
  
  // Fetch market data
  const { market, isLoading: marketLoading } = useMarketByIndex(marketId);
  
  // Fetch task data (if we have a taskId)
  const { task, loading: taskLoading } = useOracleTask(taskId);
  
  // Hook for creating tasks
  const { createTask, isLoading: createTaskLoading, isSuccess: createTaskSuccess } = useCreateTask();
  
  // Fetch registered agents
  const { agents, loading: agentsLoading } = useRegisteredAgents();

  // Handle task creation
  const handleCreateTask = () => {
    if (market && !isCreatingTask) {
      setIsCreatingTask(true);
      createTask(market.title);
    }
  };

  // Handle agent click
  const handleAgentClick = (agent: AgentData) => {
    setSelectedAgent(agent);
    setShowAgentDetails(true);
  };

  // Update taskId if creation was successful
  useEffect(() => {
    if (createTaskSuccess) {
      // In a real implementation, you'd get the taskId from the transaction receipt
      // For now, let's simulate by checking the latest task
      setTaskId(Math.floor(Math.random() * 1000)); // Mock taskId for demo
      setIsCreatingTask(false);
    }
  }, [createTaskSuccess]);

  // Calculate consensus percentage
  const getConsensusProgress = (): number => {
    if (!task || !task.respondents || task.respondents.length === 0) return 0;
    
    // This is a simplified version - in a real app, you would count YES responses
    // For now, we'll just assume 75% consensus for demonstration
    return 75;
  };

  // Calculate response progress
  const getResponsesProgress = (): number => {
    if (!task || !task.respondents) return 0;
    
    // Assuming we need at least 5 responses for consensus
    const minimumResponses = 5;
    return Math.min(100, Math.round((task.respondents.length / minimumResponses) * 100));
  };

  if (marketLoading) {
    return (
      <main className="app-container">
        <div className="main-content">
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Loading market data...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!market) {
    return (
      <main className="app-container">
        <div className="main-content">
          <div className="error-container">
            <p>Market not found</p>
            <Link href="/" className="button">Return to Markets</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-container">
      <div className="main-content">
        <div className="resolution-header">
          <h1>Market Resolution</h1>
          <Link href={`/market/${marketId}`} className="button">
            Back to Market
          </Link>
        </div>

        {/* Market Info Card */}
        <div className="market-card p-4 mb-6" style={{ backgroundColor: 'var(--card-background)' }}>
          <h2 className="market-title">{market.title}</h2>
          <p className="text-secondary">{market.description}</p>
          <div className="mt-2 flex items-center">
            <span className="text-secondary text-sm mr-2">End Date:</span>
            <span>{new Date(Number(market.endTimestamp) * 1000).toLocaleDateString()}</span>
          </div>
          {task && (
            <div className="mt-2 flex items-center">
              <span className="text-secondary text-sm mr-2">Status:</span>
              <span 
                className="px-2 py-1 rounded-full text-xs text-white" 
                style={{ backgroundColor: getStatusColor(task.status) }}
              >
                {getStatusString(task.status)}
              </span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b mb-6" style={{ borderColor: 'var(--border-color)' }}>
          <div className="market-tabs">
            <button
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-button ${activeTab === 'process' ? 'active' : ''}`}
              onClick={() => setActiveTab('process')}
            >
              Oracle Process
            </button>
            <button
              className={`tab-button ${activeTab === 'agents' ? 'active' : ''}`}
              onClick={() => setActiveTab('agents')}
            >
              AI Agents
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="resolution-status-card">
            <h3 className="market-title mb-4">Resolution Status</h3>
            
            {taskId === undefined ? (
              <div className="market-card p-4" style={{ backgroundColor: 'rgba(45, 156, 219, 0.1)' }}>
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  <h4 className="market-title">Create Oracle Task</h4>
                </div>
                <p className="text-sm text-secondary mb-4">
                  This market has not been submitted to the AI Oracle yet. Create a new task to begin the resolution process.
                </p>
                <button 
                  onClick={handleCreateTask} 
                  disabled={isCreatingTask || createTaskLoading}
                  className="create-task-button"
                >
                  {isCreatingTask || createTaskLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create Oracle Task"
                  )}
                </button>
              </div>
            ) : (
              taskLoading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Loading task data...</p>
                </div>
              ) : task && (
                <>
                  <div className="market-card p-4 mb-4">
                    <div className="task-info mb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-secondary text-sm">Task ID</p>
                          <p className="font-medium">{task.id}</p>
                        </div>
                        <div>
                          <p className="text-secondary text-sm">Status</p>
                          <p>
                            <span 
                              className="px-2 py-1 rounded-full text-xs text-white" 
                              style={{ backgroundColor: getStatusColor(task.status) }}
                            >
                              {getStatusString(task.status)}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {task.status === 2 && (
                      <div className="resolution-result p-4 rounded-md" style={{ backgroundColor: 'rgba(102, 204, 0, 0.1)' }}>
                        <h4 className="market-title mb-2">Resolution Result</h4>
                        <div className="result-box text-center p-4 bg-white rounded-md">
                          <p className="result-value text-2xl font-bold" style={{ color: 'var(--green)' }}>YES</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="market-card p-4">
                      <h4 className="market-title mb-2">Responses</h4>
                      <div className="relative pt-1">
                        <div className="text-secondary text-xs mb-1">
                          {task.respondents.length} of 5 required responses
                        </div>
                        <div className="overflow-hidden h-2 text-xs flex rounded" style={{ backgroundColor: 'var(--border-color)' }}>
                          <div 
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                            style={{ width: `${getResponsesProgress()}%`, backgroundColor: 'var(--primary-color)' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="market-card p-4">
                      <h4 className="market-title mb-2">Consensus</h4>
                      <div className="relative pt-1">
                        <div className="text-secondary text-xs mb-1">
                          {getConsensusProgress()}% YES consensus (threshold: 70%)
                        </div>
                        <div className="overflow-hidden h-2 text-xs flex rounded" style={{ backgroundColor: 'var(--border-color)' }}>
                          <div 
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                            style={{ 
                              width: `${getConsensusProgress()}%`, 
                              backgroundColor: getConsensusProgress() >= 70 ? 'var(--green)' : 'var(--primary-color)' 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Respondents Section */}
                  <div className="market-card p-4">
                    <h4 className="market-title mb-3">Respondents</h4>
                    {task.respondents.length === 0 ? (
                      <p className="text-secondary">No agents have responded yet.</p>
                    ) : (
                      <div className="respondents-list">
                        {task.respondents.map((address: string, index: number) => (
                          <div key={index} className="respondent-item p-3 mb-2 rounded" style={{ backgroundColor: 'var(--background-color)' }}>
                            <div className="flex justify-between items-center">
                              <span className="address font-mono">{address}</span>
                              <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(102, 204, 0, 0.2)', color: 'var(--green)' }}>
                                YES
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )
            )}
          </div>
        )}

        {/* Process Tab */}
        {activeTab === 'process' && (
          <>
            <div className="mb-8">
              <h3 className="market-title mb-4">Oracle Resolution Process</h3>
              
              <div className="market-card p-4 mb-6" style={{ backgroundColor: 'rgba(45, 156, 219, 0.1)' }}>
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  <h4 className="market-title">How It Works</h4>
                </div>
                <div className="space-y-3">
                  <p className="text-secondary text-sm">
                    <strong>1. Task Creation:</strong> A market resolution task is created on the Oracle Service Manager.
                  </p>
                  <p className="text-secondary text-sm">
                    <strong>2. Agent Response:</strong> Multiple AI agents independently research and respond to the task.
                  </p>
                  <p className="text-secondary text-sm">
                    <strong>3. Consensus Building:</strong> Responses are collected and consensus is determined.
                  </p>
                  <p className="text-secondary text-sm">
                    <strong>4. Result Finalization:</strong> When enough agents agree, the result is finalized on-chain.
                  </p>
                  <p className="text-secondary text-sm">
                    <strong>5. Reward Distribution:</strong> Agents that contributed to consensus are rewarded.
                  </p>
                </div>
              </div>
              
              <div className="market-card p-4 mb-6">
                <h4 className="market-title mb-3">Consensus Mechanism</h4>
                <div className="space-y-3">
                  <p className="text-secondary text-sm">
                    <strong>Multi-agent verification:</strong> Each AI agent processes the task independently, using its own reasoning.
                  </p>
                  <p className="text-secondary text-sm">
                    <strong>Threshold requirement:</strong> At least 5 agents must respond, and 70% must agree for a result to be considered valid.
                  </p>
                  <p className="text-secondary text-sm">
                    <strong>Staked verification:</strong> Agents stake tokens to participate, aligning incentives for honest reporting.
                  </p>
                </div>
              </div>
              
              <div className="market-card p-4">
                <h4 className="market-title mb-3">Data Sources</h4>
                <p className="text-secondary text-sm mb-4">
                  AI Agents analyze data from multiple sources to determine market resolution:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded" style={{ backgroundColor: 'var(--background-color)' }}>
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="font-medium">Official Government Sources</h5>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(102, 204, 0, 0.2)', color: 'var(--green)' }}>
                        Primary
                      </span>
                    </div>
                    <p className="text-secondary text-sm">
                      Official statements, websites, and documents published by relevant government bodies.
                    </p>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: 'var(--background-color)' }}>
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="font-medium">Major News Outlets</h5>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(45, 156, 219, 0.2)', color: 'var(--primary-color)' }}>
                        Secondary
                      </span>
                    </div>
                    <p className="text-secondary text-sm">
                      Reports from established and reputable news organizations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="mb-8">
            <h3 className="market-title mb-4">AI Agents</h3>
            <p className="text-sm text-secondary mb-4">
              These decentralized AI agents analyze market data and provide resolution consensus:
            </p>
            
            {agentsLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading agents...</p>
              </div>
            ) : agents && agents.length === 0 ? (
              <p className="text-secondary">No AI agents registered.</p>
            ) : (
              <div className="agents-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent: AgentData, index: number) => (
                  <div 
                    key={index} 
                    className="agent-card cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleAgentClick(agent)}
                  >
                    <div className="agent-header p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{agent.modelType} v{agent.modelVersion}</h4>
                        <span className={`agent-status text-xs px-2 py-1 rounded-full status-${getAgentStatusString(agent.status).toLowerCase()}`}>
                          {getAgentStatusString(agent.status)}
                        </span>
                      </div>
                    </div>
                    <div className="agent-details p-3">
                      <p className="mb-1">
                        <span className="text-secondary">Address: </span>
                        <span className="font-mono text-sm">{`${agent.address.substring(0, 6)}...${agent.address.substring(agent.address.length - 4)}`}</span>
                      </p>
                      <p className="mb-1">
                        <span className="text-secondary">Tasks Completed: </span>
                        <span>{agent.tasksCompleted}</span>
                      </p>
                      <p className="mb-1">
                        <span className="text-secondary">Consensus Participations: </span>
                        <span>{agent.consensusParticipations}</span>
                      </p>
                      <p>
                        <span className="text-secondary">Rewards Earned: </span>
                        <span>{agent.rewardsEarned}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Agent Details Modal */}
        {showAgentDetails && selectedAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="market-card p-6 max-w-lg w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="market-title">{selectedAgent.modelType} v{selectedAgent.modelVersion}</h3>
                <button 
                  onClick={() => setShowAgentDetails(false)}
                  className="text-secondary hover:text-primary"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: 'var(--background-color)' }}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-secondary">Address:</p>
                      <p className="font-mono">{selectedAgent.address}</p>
                    </div>
                    <div>
                      <p className="text-secondary">Status:</p>
                      <p>
                        <span className={`text-xs px-2 py-1 rounded-full status-${getAgentStatusString(selectedAgent.status).toLowerCase()}`}>
                          {getAgentStatusString(selectedAgent.status)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-secondary">Tasks Completed:</p>
                      <p>{selectedAgent.tasksCompleted}</p>
                    </div>
                    <div>
                      <p className="text-secondary">Consensus Participations:</p>
                      <p>{selectedAgent.consensusParticipations}</p>
                    </div>
                    <div>
                      <p className="text-secondary">Rewards Earned:</p>
                      <p>{selectedAgent.rewardsEarned}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded mb-4" style={{ backgroundColor: 'rgba(45, 156, 219, 0.1)' }}>
                  <h4 className="market-title mb-2">How This Agent Works</h4>
                  <p className="text-sm text-secondary mb-2">
                    This AI agent uses a {selectedAgent.modelType} model to analyze data from multiple sources and predict the market outcome.
                  </p>
                  <p className="text-sm text-secondary">
                    The agent monitors for new tasks, generates a response, signs it with its private key, and submits it to the Oracle contract.
                  </p>
                </div>
                
                <div className="p-4 rounded" style={{ backgroundColor: 'var(--background-color)' }}>
                  <h4 className="market-title mb-2">Recent Performance</h4>
                  <div className="mb-3">
                    <p className="text-sm text-secondary mb-1">Accuracy Rate</p>
                    <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--border-color)' }}>
                      <div 
                        className="h-2 rounded-full"
                        style={{ width: '92%', backgroundColor: 'var(--green)' }}
                      ></div>
                    </div>
                    <p className="text-xs text-right mt-1">92%</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary mb-1">Response Time (avg)</p>
                    <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--border-color)' }}>
                      <div 
                        className="h-2 rounded-full"
                        style={{ width: '78%', backgroundColor: 'var(--primary-color)' }}
                      ></div>
                    </div>
                    <p className="text-xs text-right mt-1">78 seconds</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setShowAgentDetails(false)} 
                  className="banner-button"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 