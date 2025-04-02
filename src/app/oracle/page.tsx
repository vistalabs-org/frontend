"use client";
import React, { useMemo } from 'react';
import OracleLogicVisualizer from '@/components/OracleLogicVisualizer';
import Link from 'next/link';
import { useLatestTaskNum, useOracleTask, useRegisteredAgents, Agent } from '@/hooks/useOracleData';

// Define expected status types for the visualizer
type VisualizerTaskStatus = 'Created' | 'InProgress' | 'Resolved'; 

// Updated mapping function
const getTaskStatusString = (statusNumber: number | undefined): VisualizerTaskStatus | 'Loading...' | 'Unknown' => {
  if (statusNumber === undefined) return 'Loading...';
  // Map based on expected contract values and Visualizer types
  switch (statusNumber) {
    case 0: return 'Created'; // Assuming 0 maps to Created
    case 1: return 'InProgress';
    case 2: return 'Resolved';
    // case 3: // Handle 'Disputed' if needed by visualizer
    default: return 'Unknown'; // Statuses not handled by visualizer
  }
};

const OraclePage = () => {
  // 1. Fetch the latest task number
  const { latestTaskNum, isLoading: isLoadingTaskNum, error: errorTaskNum } = useLatestTaskNum();
  
  // 2. Fetch the details for the latest task
  // Pass latestTaskNum (which can be undefined initially)
  const { task, loading: isLoadingTask, error: errorTask } = useOracleTask(latestTaskNum);

  // 3. Fetch all registered agents
  const { agents: registeredAgents, loading: isLoadingAgents, error: errorAgents } = useRegisteredAgents();
  
  // Combine loading states
  const isLoading = isLoadingTaskNum || (latestTaskNum !== undefined && isLoadingTask) || isLoadingAgents;
  // Combine error states
  const error = errorTaskNum || errorTask || errorAgents;

  // 4. Prepare data for the visualizer once task and agents are loaded
  const visualizerData = useMemo(() => {
    if (!task || !registeredAgents || registeredAgents.length === 0) {
      return null;
    }
    
    const mappedStatus = getTaskStatusString(task.status);

    // Only proceed if the status is one the visualizer understands
    if (mappedStatus === 'Loading...' || mappedStatus === 'Unknown') {
        console.warn(`Task ${task.id} has unhandled status for visualizer: ${mappedStatus} (raw: ${task.status})`);
        return null; // Don't create visualizer data for statuses it can't handle
    }
    
    const marketQuestion = `Task ID: ${task.id} - Market Question Not Available`; 
    const resolutionDate = "Resolution Date Not Available"; 

    // Added Agent type annotation
    const agentsForVisualizer = registeredAgents.map((agent: Agent) => { 
       const hasResponded = task.respondents.includes(agent.address);
       const response = hasResponded ? "Response Data Unavailable" : undefined; 
       // TODO: Fetch/calculate actual agent status, reliability, response time
       return {
         id: agent.address, 
         address: agent.address,
         status: 'active' as const, // Placeholder
         reliability: agent.details ? Number(agent.details.consensusParticipations) : 0, // Placeholder
         responseTime: 0, // Placeholder
         hasResponded: hasResponded,
         response: response, // Placeholder
       };
    });

    // Map task data - status type is now guaranteed to be VisualizerTaskStatus
    const taskForVisualizer = {
      id: task.id,
      name: marketQuestion, 
      taskCreatedBlock: 0, // Placeholder
      status: mappedStatus, // Use the validated & mapped status
      respondents: task.respondents.length,
      consensusThreshold: 70, // Placeholder
      minimumResponses: 5, // Placeholder
      currentResponses: task.respondents.length, 
      consensusResult: task.consensusResult, 
    };
    // Note: This assumes the overall structure matches the OracleTask type expected by the visualizer.
    // Further errors might indicate missing/mismatched properties beyond 'status'.

    return {
      marketId: String(task.id),
      marketQuestion,
      resolutionDate,
      task: taskForVisualizer, // Pass the object assumed to match OracleTask type
      agents: agentsForVisualizer,
      consensusThreshold: taskForVisualizer.consensusThreshold, 
      minimumResponses: taskForVisualizer.minimumResponses, 
    };
  }, [task, registeredAgents]); 

  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="banner-title text-3xl">AI Oracle Resolution System</h1>
        <p className="banner-description mt-2">
          Understanding how prediction markets are resolved with decentralized AI consensus
        </p>
      </div>
      
      {/* About Section */}
      <div className="mb-6 market-card">
        <div className="market-header">
          <div className="flex-shrink-0 mr-4">
            <div className="market-icon-container bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="market-title-container">
            <div className="market-title-link">
              <h2 className="market-title">About the EigenLayer AI Oracle</h2>
              <p className="text-secondary mb-4">
                Our prediction markets use a decentralized AI oracle system built on EigenLayer to determine outcomes.
                This ensures that markets are resolved fairly, transparently, and accurately based
                on real-world events.
              </p>
              <p className="text-secondary">
                The visualization below demonstrates how multiple AI agents analyze data independently,
                submit cryptographically signed responses to the blockchain, and reach consensus to
                determine market outcomes.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Market Example Title - Updated for Latest Task */}
      <div className="mb-4">
        <h2 className="market-title">
          Latest Oracle Task Status (Task ID: {latestTaskNum ?? (isLoadingTaskNum ? 'Loading...' : 'N/A')})
        </h2>
        <p className="text-secondary">
          This visualization shows the current state of the most recent task submitted to the AI Oracle.
        </p>
         {errorTaskNum && <p className="text-red-500">Error loading latest task number: {errorTaskNum.message}</p>}
      </div>
      
      {/* Oracle Logic Visualizer - Updated */}
      <div className="market-card mb-8">
        {isLoading && <p className="p-4 text-center">Loading oracle data...</p>}
        {error && <p className="p-4 text-center text-red-500">Error loading data: {error.message}</p>}
        {!isLoading && !error && !visualizerData && latestTaskNum !== undefined && (
             <p className="p-4 text-center">No data available for Task ID {latestTaskNum}, or its status is not currently visualizable (Status: {getTaskStatusString(task?.status)}).</p>
        )}
         {!isLoading && !error && !visualizerData && latestTaskNum === undefined && !isLoadingTaskNum && (
             <p className="p-4 text-center">No tasks found or unable to load the latest task number.</p>
        )}
        {!isLoading && !error && visualizerData && (
          <OracleLogicVisualizer 
            marketId={visualizerData.marketId}
            marketQuestion={visualizerData.marketQuestion}
            resolutionDate={visualizerData.resolutionDate}
            task={visualizerData.task}
            agents={visualizerData.agents}
            consensusThreshold={visualizerData.consensusThreshold}
            minimumResponses={visualizerData.minimumResponses}
          />
        )}
      </div>
      
      {/* Technical Implementation Section */}
      <div className="mb-8">
        <h2 className="market-title text-2xl mb-4">Technical Implementation</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="market-card">
            <div className="market-content">
              <div className="flex items-center mb-4">
                <div className="market-icon-container bg-blue-100">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="market-title text-lg ml-3">Smart Contract Architecture</h3>
              </div>
              <p className="text-secondary text-sm">
                The oracle system uses the <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">AIOracleServiceManager</code> contract that implements EigenLayer's middleware interfaces. 
                This contract manages task creation, agent responses, and consensus calculation, with minimum response thresholds and reward distribution.
              </p>
            </div>
          </div>
          
          <div className="market-card">
            <div className="market-content">
              <div className="flex items-center mb-4">
                <div className="market-icon-container bg-blue-100">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="market-title text-lg ml-3">AI Agent Implementation</h3>
              </div>
              <p className="text-secondary text-sm">
                Each AI agent runs as a Python service that monitors the blockchain for new tasks. When a task is detected,
                the agent uses a Large Language Model to analyze the data and sign its response using its private key.
              </p>
            </div>
          </div>
          
          <div className="market-card">
            <div className="market-content">
              <div className="flex items-center mb-4">
                <div className="market-icon-container bg-blue-100">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="market-title text-lg ml-3">Consensus Mechanism</h3>
              </div>
              <p className="text-secondary text-sm">
                For a market resolution to be finalized, a minimum number of agent responses must be received,
                and a threshold percentage must agree on the outcome, ensuring resistance to manipulation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="market-card mb-8">
        <div className="market-content">
          <h2 className="market-title text-2xl mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="border-b border-border-color pb-4">
              <h3 className="market-title text-lg mb-2">What is an oracle?</h3>
              <p className="text-secondary">
                An oracle is a system that brings off-chain (real-world) data onto a blockchain for use in smart contracts.
                In prediction markets, oracles determine the outcome of events that markets are predicting.
              </p>
            </div>
            
            <div className="border-b border-border-color pb-4">
              <h3 className="market-title text-lg mb-2">Why use AI for oracles?</h3>
              <p className="text-secondary">
                AI systems can process and analyze large amounts of data from diverse sources, enabling more accurate
                and nuanced evaluations of complex real-world events. Multiple independent AI agents working together
                provide decentralization and redundancy, ensuring fair and reliable outcomes.
              </p>
            </div>
            
            <div className="border-b border-border-color pb-4">
              <h3 className="market-title text-lg mb-2">How are disputes handled?</h3>
              <p className="text-secondary">
                If market participants believe an outcome was incorrectly reported, they can raise a dispute during the
                dispute period. Disputes are resolved through a decentralized voting process by token holders.
              </p>
            </div>
            
            <div>
              <h3 className="market-title text-lg mb-2">What happens if data sources conflict?</h3>
              <p className="text-secondary">
                When data sources provide conflicting information, the AI agents weigh sources based on their reliability rating
                and use their models to determine the most likely correct outcome. The consensus mechanism ensures that
                a majority of agents must agree, providing protection against individual errors or bias.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OraclePage;