"use client";

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  useLatestTaskNum, 
  useOracleTask, 
  useCreateTask, 
  useRegisteredAgents 
} from '@/hooks/useOracleData';
import { 
  useResolveMarket,
  useMarketData
} from '@/hooks/useMarketActions';
import OracleLogicVisualizer from '@/components/OracleLogicVisualizer';

// --- Import Shadcn UI Components ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react'; // Import a spinner icon

const MarketResolvePage = () => {
  const params = useParams();
  const marketId = params?.id as string;
  const [marketQuestion, setMarketQuestion] = useState('');
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [resolutionOutcome, setResolutionOutcome] = useState<boolean | null>(null);
  
  // --- Fetch Market Data ---
  const { 
    marketData, 
    isLoading: isLoadingMarketData, 
    refetch: refetchMarketData 
  } = useMarketData(marketId);

  // --- Oracle Task Hooks ---
  const { latestTaskNum, isLoading: isLoadingTaskNum } = useLatestTaskNum();
  const { task, loading: isLoadingTask } = useOracleTask(latestTaskNum);
  const { agents, loading: isLoadingAgents } = useRegisteredAgents();
  const { 
    createTask, 
    isLoading: isCreatingOracleTask, 
    isSuccess: isCreateTaskSuccess, 
    isError: isCreateTaskError, 
    error: createTaskError, 
    transactionHash: createTaskTxHash 
  } = useCreateTask();

  // --- Resolve Market Hook ---
  const { 
    resolveMarket, 
    isLoading: isResolvingMarket, 
    isSuccess: isResolveSuccess, 
    isError: isResolveError, 
    error: resolveError, 
    transactionHash: resolveTxHash 
  } = useResolveMarket();

  // Refetch market data after successful resolution
  useEffect(() => {
    if (isResolveSuccess) {
      refetchMarketData();
      setResolutionOutcome(null);
    }
  }, [isResolveSuccess, refetchMarketData]);

  const handleCreateTask = () => {
    if (!marketQuestion.trim()) {
      alert('Please enter a market question');
      return;
    }
    try {
      createTask(marketQuestion);
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  // Format task data for the visualizer
  const formatTaskForVisualizer = () => {
    if (!task) return undefined;
    
    const taskStatus: 'Created' | 'InProgress' | 'Resolved' = 
      task.status === 0 ? 'Created' : task.status === 1 ? 'InProgress' : 'Resolved';

    return {
      id: task.id,
      name: marketQuestion || `Market #${marketId} Resolution`,
      taskCreatedBlock: 0,
      status: taskStatus,
      respondents: task.respondents.length,
      consensusThreshold: 70,
      minimumResponses: 5,
      currentResponses: task.respondents.length
    };
  };

  // Format agents data for the visualizer
  const formatAgentsForVisualizer = () => {
    if (!agents || !task) return [];
    
    return agents.map((agent, index) => {
      const hasResponded = task.respondents.includes(agent.address);
      const agentStatus: "active" | "inactive" = agent.details ? 'active' : 'inactive';

      return {
        id: index + 1,
        address: agent.address,
        status: agentStatus,
        responseTime: hasResponded ? Math.floor(Math.random() * 100) + 30 : 0,
        reliability: agent.details ? 
          Number(agent.details.consensusParticipations) > 0 ? 
            Math.min(95, 80 + Number(agent.details.tasksCompleted) % 15) : 90 
          : 85,
        hasResponded,
        response: hasResponded ? Math.random() > 0.5 ? 'YES' : 'NO' : undefined
      };
    });
  };

  // --- Handle Market Resolution ---
  const handleResolve = async (outcome: boolean) => {
    if (!marketId) return;
    setResolutionOutcome(outcome);
    try {
      await resolveMarket(marketId, outcome);
    } catch (err) {
      console.error("Failed to resolve market:", err);
      setResolutionOutcome(null);
    }
  };

  const isMarketActive = marketData?.state === 0;
  const isMarketInResolution = marketData?.state === 1;
  const isMarketResolved = marketData?.state === 2;
  const isMarketCancelled = marketData?.state === 3;

  return (
    <div className="max-w-screen-xl mx-auto py-6 text-primary">
      <div className="px-6">
        <h1 className="text-2xl font-bold mb-4">Resolve Market</h1>
        <p className="text-secondary mb-6">
          Market resolution is powered by our decentralized AI oracle system. 
          Create a task to resolve this market using AI agents.
        </p>
        
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>
              {isLoadingMarketData ? "Loading Market..." : `Market #${marketId} - ${marketData?.title || 'Details'}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingMarketData ? (
              <p>Loading market status...</p>
            ) : marketData ? (
              <>
                <p className="mb-2">Current State: 
                  <span className="font-semibold">
                    { isMarketActive && "Active" }
                    { isMarketInResolution && "In Resolution" }
                    { isMarketResolved && `Resolved (${marketData.outcome ? 'YES' : 'NO'})` }
                    { isMarketCancelled && "Cancelled" }
                    { marketData.state > 3 && "Unknown" } 
                  </span>
                </p>

                {(isMarketActive || isMarketInResolution) && (
                  <div className="mt-4 pt-4 border-t border-border-color">
                    <h3 className="text-lg font-semibold mb-3">Manually Resolve Market</h3>
                    <p className="text-sm text-secondary mb-3">
                      Only use this if the oracle resolution failed or is not applicable. This action is irreversible.
                    </p>
                    <div className="flex space-x-4">
                      <Button
                        variant="default"
                        onClick={() => handleResolve(true)} 
                        disabled={isResolvingMarket}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isResolvingMarket && resolutionOutcome === true ? (
                           <span className="flex items-center justify-center">
                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resolving YES...
                          </span>
                        ) : "Resolve YES"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleResolve(false)} 
                        disabled={isResolvingMarket}
                        className="flex-1"
                      >
                        {isResolvingMarket && resolutionOutcome === false ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resolving NO...
                          </span>
                        ) : "Resolve NO"}
                      </Button>
                    </div>
                    {isResolveError && (
                      <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">
                        Error resolving: {resolveError?.message || 'Failed to resolve market'}
                      </div>
                    )}
                    {isResolveSuccess && resolveTxHash && (
                      <div className="mt-2 p-2 bg-green-100 text-green-700 rounded text-sm">
                        Market resolution submitted! Tx: {resolveTxHash.slice(0,10)}...{resolveTxHash.slice(-8)}
                      </div>
                    )}
                  </div>
                )}

                {isMarketResolved && (
                    <p className="mt-4 text-green-600">This market has been resolved.</p>
                )}
                 {isMarketCancelled && (
                    <p className="mt-4 text-red-600">This market has been cancelled.</p>
                )}
              </>
            ) : (
              <p>Could not load market data.</p> 
            )}
          </CardContent>
        </Card>
        
        {(isMarketActive || isMarketInResolution) && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Oracle Task</CardTitle>
            </CardHeader>
            <CardContent>
              {task ? (
                <div className="mb-4">
                  <div className="flex items-center text-green-600 mb-2">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Task has been created</span>
                  </div>
                  <div className="p-3 border rounded-md bg-muted text-muted-foreground">
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
                      variant="outline"
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
                <div className="mb-4 space-y-3">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="market-question">Market Question</Label>
                    <Input
                      type="text"
                      id="market-question"
                      placeholder="E.g., Will candidate X win the 2024 election?"
                      value={marketQuestion}
                      onChange={(e) => setMarketQuestion(e.target.value)}
                    />
                  </div>
                   <p className="text-sm text-muted-foreground">
                      This question will be sent to AI agents to determine the market outcome.
                    </p>
                  
                  <Button
                    onClick={handleCreateTask} 
                    disabled={isCreatingOracleTask || !marketQuestion}
                    className="w-full"
                  >
                    {isCreatingOracleTask ? (
                      <span className="flex items-center justify-center">
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Task...
                      </span>
                    ) : 'Create Oracle Task'}
                  </Button>
                  
                  {isCreateTaskError && (
                    <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">
                      Error: {createTaskError?.message || 'Failed to create task'}
                    </div>
                  )}
                  
                  {isCreateTaskSuccess && createTaskTxHash && (
                    <div className="mt-2 p-2 bg-green-100 text-green-700 rounded text-sm">
                      Task created successfully! Tx: {createTaskTxHash.slice(0,10)}...{createTaskTxHash.slice(-8)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        <Card className="mb-4">
           <CardHeader>
            <CardTitle>AI Agents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAgents ? (
              <div className="text-center py-4 text-secondary">Loading agents...</div>
            ) : agents && agents.length > 0 ? (
              <div>
                <p className="text-secondary mb-4">
                  {agents.length} AI agents ready to resolve this market
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agents.slice(0, 4).map((agent, index) => (
                     <Card key={index}>
                      <CardContent className="p-3 text-sm">
                        <strong>Address:</strong> {agent.address.slice(0, 6)}...{agent.address.slice(-4)}<br />
                        {agent.details && (
                          <>
                            <strong>Model:</strong> {agent.details.modelType} {agent.details.modelVersion}<br />
                            <strong>Tasks:</strong> {agent.details.tasksCompleted.toString()}<br />
                            <strong>Consensus:</strong> {agent.details.consensusParticipations.toString()}
                          </>
                        )}
                      </CardContent>
                    </Card>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketResolvePage; 