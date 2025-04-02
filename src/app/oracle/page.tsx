"use client";
import React, { useMemo } from 'react';
import OracleLogicVisualizer from '@/components/OracleLogicVisualizer';
import Link from 'next/link';

// Add edge runtime configuration
export const runtime = 'edge';

// Example market data
const exampleMarket = {
  id: 'market-123',
  title: 'Will Trump end Department of Education in 2025?',
  question: 'Will the U.S. Department of Education be dismantled by December 31, 2025?',
  resolutionDate: 'December 31, 2025, 11:59 PM ET'
};

// Example task data (with proper types)
const exampleTask = {
  id: 123,
  name: 'Will the U.S. Department of Education be dismantled by December 31, 2025?',
  taskCreatedBlock: 8764321,
  status: 'InProgress' as const, // Use const assertion to fix type
  respondents: 3,
  consensusThreshold: 70, // 70%
  minimumResponses: 5,
  currentResponses: 3
};

// Example resolved task (to show full resolution flow)
const resolvedTask = {
  id: 456,
  name: 'Will Tesla stock price exceed $300 by March 1, 2025?',
  taskCreatedBlock: 8712345,
  status: 'Resolved' as const, // Use const assertion to fix type
  respondents: 5,
  consensusThreshold: 70,
  minimumResponses: 5,
  currentResponses: 5
};

// Example AI agents (with proper types)
const exampleAgents = [
  {
    id: 1,
    address: '0x1a2b...3c4d',
    status: 'active' as const,
    responseTime: 45,
    reliability: 98,
    hasResponded: true,
    response: 'YES'
  },
  {
    id: 2,
    address: '0x5e6f...7g8h',
    status: 'active' as const,
    responseTime: 63,
    reliability: 95,
    hasResponded: true,
    response: 'YES'
  },
  {
    id: 3,
    address: '0x9i10...11j12',
    status: 'active' as const,
    responseTime: 112,
    reliability: 92,
    hasResponded: true,
    response: 'NO'
  },
  {
    id: 4,
    address: '0x13k14...15l16',
    status: 'active' as const,
    responseTime: 0,
    reliability: 96,
    hasResponded: false
  },
  {
    id: 5,
    address: '0x17m18...19n20',
    status: 'active' as const,
    responseTime: 0,
    reliability: 91,
    hasResponded: false
  }
];

// Agents for resolved task
const resolvedAgents = [
  {
    id: 1,
    address: '0x1a2b...3c4d',
    status: 'active' as const,
    responseTime: 33,
    reliability: 98,
    hasResponded: true,
    response: 'YES'
  },
  {
    id: 2,
    address: '0x5e6f...7g8h',
    status: 'active' as const,
    responseTime: 47,
    reliability: 95,
    hasResponded: true,
    response: 'YES'
  },
  {
    id: 3,
    address: '0x9i10...11j12',
    status: 'active' as const,
    responseTime: 58,
    reliability: 92,
    hasResponded: true,
    response: 'YES'
  },
  {
    id: 4,
    address: '0x13k14...15l16',
    status: 'active' as const,
    responseTime: 72,
    reliability: 96,
    hasResponded: true,
    response: 'YES'
  },
  {
    id: 5,
    address: '0x17m18...19n20',
    status: 'active' as const,
    responseTime: 89,
    reliability: 91,
    hasResponded: true,
    response: 'NO'
  }
];

const OraclePage = () => {
  const [showResolved, setShowResolved] = useState(false);
  
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