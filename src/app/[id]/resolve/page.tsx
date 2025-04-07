"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  useLatestTaskNum, 
  useOracleTask, 
  useCreateTask, 
  useRegisteredAgents 
} from '@/hooks/useOracleData';
import OracleLogicVisualizer from '@/components/OracleLogicVisualizer';
import { useConfig } from 'wagmi';
import { formatUnits } from 'ethers';

// Helper components
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`market-card mb-4 ${className}`}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  className = '', 
  disabled = false 
}: {
  children: React.ReactNode,
  variant?: 'primary' | 'secondary' | 'outline',
  onClick?: () => void,
  className?: string,
  disabled?: boolean
}) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variantClasses: Record<string, string> = {
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

const MarketResolvePage = () => {
  const params = useParams();
  const marketId = params?.id as string;
  const [marketQuestion, setMarketQuestion] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  
  // Get the latest task number from the oracle
  const { latestTaskNum, isLoading: isLoadingTaskNum } = useLatestTaskNum();
  
  // If a task exists, fetch its data
  const { task, loading: isLoadingTask } = useOracleTask(latestTaskNum);
  
  // Get registered agents
  const { agents, loading: isLoadingAgents } = useRegisteredAgents();
  
  // Create task function
  const { createTask, isLoading, isSuccess, isError, error, transactionHash } = useCreateTask();

  const handleCreateTask = () => {
    if (!marketQuestion.trim()) {
      alert('Please enter a market question');
      return;
    }
    
    setIsCreatingTask(true);
    try {
      createTask(marketQuestion);
    } catch (err) {
      console.error('Error creating task:', err);
      setIsCreatingTask(false);
    }
  };

  // Reset state when transaction is successful
  React.useEffect(() => {
    if (isSuccess) {
      setIsCreatingTask(false);
    }
  }, [isSuccess]);

  // Format task data for the visualizer
  const formatTaskForVisualizer = () => {
    if (!task) return null;
    
    return {
      id: task.id,
      name: marketQuestion || `Market #${marketId} Resolution`,
      taskCreatedBlock: 0, // We don't have this info in the task data
      status: task.status === 0 ? 'Created' : task.status === 1 ? 'InProgress' : 'Resolved',
      respondents: task.respondents.length,
      consensusThreshold: 70, // Default value, could be fetched from contract
      minimumResponses: 5, // Default value, could be fetched from contract
      currentResponses: task.respondents.length
    };
  };

  // Format agents data for the visualizer
  const formatAgentsForVisualizer = () => {
    if (!agents || !task) return [];
    
    return agents.map((agent, index) => {
      const hasResponded = task.respondents.includes(agent.address);
      
      return {
        id: index + 1,
        address: agent.address,
        status: agent.details ? 'active' : 'inactive',
        responseTime: hasResponded ? Math.floor(Math.random() * 100) + 30 : 0, // Mock data
        reliability: agent.details ? 
          Number(agent.details.consensusParticipations) > 0 ? 
            Math.min(95, 80 + Number(agent.details.tasksCompleted) % 15) : 90 
          : 85, // Mock reliability based on agent stats
        hasResponded,
        response: hasResponded ? Math.random() > 0.5 ? 'YES' : 'NO' : undefined // Mock response
      };
    });
  };

  return (
    <div className="max-w-screen-xl mx-auto py-6 text-primary">
      <div className="px-6">
        <h1 className="text-2xl font-bold mb-4">Resolve Market</h1>
        <p className="text-secondary mb-6">
          Market resolution is powered by our decentralized AI oracle system. 
          Create a task to resolve this market using AI agents.
        </p>
        
        <Card>
          <div className="market-header">
            <h2 className="market-title">Market #{marketId}</h2>
          </div>
          <div className="market-content p-4">
            {task ? (
              <div className="mb-4">
                <div className="flex items-center text-green mb-2">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Task has been created</span>
                </div>
                <div className="market-card p-3 bg-card-background">
                  <p className="text-sm">
                    <strong>Task ID:</strong> {task.id}<br />
                    <strong>Status:</strong> {task.status === 0 ? 'Created' : task.status === 1 ? 'In Progress' : 'Resolved'}<br />
                    <strong>Respondents:</strong> {task.respondents.length}<br />
                    <strong>Is Resolved:</strong> {task.consensusResult?.isResolved ? 'Yes' : 'No'}<br />
                    {task.consensusResult?.isResolved && (
                      <>
                        <strong>Result:</strong> {task.consensusResult.result}
                      </>
                    )}
                  </p>
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={() => setShowVisualizer(!showVisualizer)} 
                    className="w-full"
                  >
                    {showVisualizer ? 'Hide' : 'Show'} Oracle Visualization
                  </Button>
                </div>
                
                {showVisualizer && (
                  <div className="mt-4">
                    <OracleLogicVisualizer 
                      marketId={marketId}
                      marketQuestion={marketQuestion || `Market #${marketId} Resolution`}
                      task={formatTaskForVisualizer()}
                      agents={formatAgentsForVisualizer()}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Market Question
                  </label>
                  <input
                    type="text"
                    className="block w-full pl-3 pr-3 py-2 sm:text-sm border-border-color rounded-md bg-card-background text-primary"
                    style={{ backgroundColor: 'var(--card-background)', borderColor: 'var(--border-color)' }}
                    placeholder="E.g., Will candidate X win the 2024 election?"
                    value={marketQuestion}
                    onChange={(e) => setMarketQuestion(e.target.value)}
                  />
                  <p className="mt-1 text-sm text-secondary">
                    This question will be sent to AI agents to determine the market outcome.
                  </p>
                </div>
                
                <Button 
                  onClick={handleCreateTask} 
                  disabled={isLoading || isCreatingTask || !marketQuestion}
                  className="w-full"
                >
                  {isLoading || isCreatingTask ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Task...
                    </span>
                  ) : 'Create Oracle Task'}
                </Button>
                
                {isError && (
                  <div className="mt-2 p-2 bg-red bg-opacity-20 text-red-400 rounded text-sm">
                    Error: {error?.message || 'Failed to create task'}
                  </div>
                )}
                
                {isSuccess && (
                  <div className="mt-2 p-2 bg-green bg-opacity-20 text-green-400 rounded text-sm">
                    Task created successfully! Transaction: {transactionHash}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
        
        <Card>
          <div className="market-header">
            <h2 className="market-title">AI Agents</h2>
          </div>
          <div className="market-content p-4">
            {isLoadingAgents ? (
              <div className="text-center py-4 text-secondary">Loading agents...</div>
            ) : agents && agents.length > 0 ? (
              <div>
                <p className="text-secondary mb-4">
                  {agents.length} AI agents ready to resolve this market
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agents.slice(0, 4).map((agent, index) => (
                    <div key={index} className="p-3 market-card bg-card-background">
                      <div className="text-sm">
                        <strong>Address:</strong> {agent.address.slice(0, 6)}...{agent.address.slice(-4)}<br />
                        {agent.details && (
                          <>
                            <strong>Model:</strong> {agent.details.modelType} {agent.details.modelVersion}<br />
                            <strong>Tasks:</strong> {agent.details.tasksCompleted.toString()}<br />
                            <strong>Consensus:</strong> {agent.details.consensusParticipations.toString()}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {agents.length > 4 && (
                  <p className="text-center mt-2 text-secondary text-sm">
                    +{agents.length - 4} more agents
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-secondary">No agents found</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MarketResolvePage; 