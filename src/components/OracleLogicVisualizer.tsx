"use client";
import React, { useState } from 'react';

interface OracleTask {
  id: number;
  name: string;
  taskCreatedBlock: number;
  status: 'Created' | 'InProgress' | 'Resolved';
  respondents: number;
  consensusThreshold: number;
  minimumResponses: number;
  currentResponses: number;
}

interface OracleAgent {
  id: number;
  address: string;
  status: 'active' | 'inactive';
  responseTime: number; // in seconds
  reliability: number; // 0-100
  hasResponded: boolean;
  response?: string;
}

interface DataSource {
  id: number;
  name: string;
  type: 'primary' | 'secondary' | 'fallback';
  reliability: number; // 0-100
  description: string;
}

interface OracleLogicVisualizerProps {
  marketId?: string;
  marketQuestion?: string;
  resolutionDate?: string;
  task?: OracleTask;
  agents?: OracleAgent[];
  dataSources?: DataSource[];
  consensusThreshold?: number;
  minimumResponses?: number;
}

const defaultTask: OracleTask = {
  id: 123,
  name: 'Will the US Department of Education be dismantled by the end of 2025?',
  taskCreatedBlock: 8764321,
  status: 'InProgress',
  respondents: 3,
  consensusThreshold: 70, // 70%
  minimumResponses: 5,
  currentResponses: 3
};

const defaultAgents: OracleAgent[] = [
  {
    id: 1,
    address: '0x1a2b...3c4d',
    status: 'active',
    responseTime: 45,
    reliability: 98,
    hasResponded: true,
    response: 'YES'
  },
  {
    id: 2,
    address: '0x5e6f...7g8h',
    status: 'active',
    responseTime: 63,
    reliability: 95,
    hasResponded: true,
    response: 'YES'
  },
  {
    id: 3,
    address: '0x9i10...11j12',
    status: 'active',
    responseTime: 112,
    reliability: 92,
    hasResponded: true,
    response: 'NO'
  },
  {
    id: 4,
    address: '0x13k14...15l16',
    status: 'active',
    responseTime: 0,
    reliability: 96,
    hasResponded: false
  },
  {
    id: 5,
    address: '0x17m18...19n20',
    status: 'active',
    responseTime: 0,
    reliability: 91,
    hasResponded: false
  },
  {
    id: 6,
    address: '0x21o22...23p24',
    status: 'inactive',
    responseTime: 0,
    reliability: 85,
    hasResponded: false
  }
];

const defaultDataSources: DataSource[] = [
  {
    id: 1,
    name: 'Official Government Sources',
    type: 'primary',
    reliability: 90,
    description: 'Official statements, websites, and documents published by relevant government bodies.'
  },
  {
    id: 2,
    name: 'Major News Outlets',
    type: 'secondary',
    reliability: 75,
    description: 'Reports from established and reputable news organizations.'
  },
  {
    id: 3,
    name: 'Market Experts',
    type: 'secondary',
    reliability: 80,
    description: 'Analysis and reports from industry experts and analysts.'
  },
  {
    id: 4,
    name: 'Social Media Monitoring',
    type: 'fallback',
    reliability: 40,
    description: 'Monitoring of relevant hashtags and official accounts on social media platforms.'
  }
];

const OracleLogicVisualizer: React.FC<OracleLogicVisualizerProps> = ({
  marketId = 'default-market',
  marketQuestion = 'Will the US Department of Education be dismantled by the end of 2025?',
  resolutionDate = 'December 31, 2025, 11:59 PM ET',
  task = defaultTask,
  agents = defaultAgents,
  dataSources = defaultDataSources,
  consensusThreshold = 70,
  minimumResponses = 5
}) => {
  const [selectedAgent, setSelectedAgent] = useState<OracleAgent | null>(null);
  const [showAgentDetails, setShowAgentDetails] = useState(false);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [showSourceDetails, setShowSourceDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'process' | 'agents'>('process');

  const handleAgentClick = (agent: OracleAgent) => {
    setSelectedAgent(agent);
    setShowAgentDetails(true);
  };

  const handleSourceClick = (source: DataSource) => {
    setSelectedSource(source);
    setShowSourceDetails(true);
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'Created': return 'bg-yellow-500';
      case 'InProgress': return 'bg-blue-500';
      case 'Resolved': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getAgentStatusColor = (agent: OracleAgent) => {
    if (agent.status === 'inactive') return 'bg-gray-200';
    if (agent.hasResponded) return 'bg-green-100';
    return 'bg-blue-100';
  };

  const getConsensusProgress = () => {
    // Current consensus based on responses
    const yesResponses = agents.filter(a => a.hasResponded && a.response === 'YES').length;
    const totalResponses = agents.filter(a => a.hasResponded).length;
    
    // Convert to percentage or return 0 if no responses
    return totalResponses > 0 ? Math.round((yesResponses / totalResponses) * 100) : 0;
  };

  const getResponsesProgress = () => {
    // Calculate percentage of completed responses
    return Math.round((task.currentResponses / task.minimumResponses) * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Oracle Logic Visualization</h2>
        <p className="text-gray-600 mb-4">
          This visualization shows how the AI Oracle Service Manager determines the outcome for:
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-lg">{marketQuestion}</h3>
          <p className="text-gray-500 text-sm">Resolution Date: {resolutionDate}</p>
          <div className="mt-2 flex items-center">
            <span className="text-gray-500 text-sm mr-2">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs text-white ${getTaskStatusColor(task.status)}`}>
              {task.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b mb-6">
        <div className="flex space-x-4">
          <button
            className={`py-2 px-4 focus:outline-none ${
              activeTab === 'process' 
                ? 'border-b-2 border-blue-500 font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('process')}
          >
            Oracle Process
          </button>
          <button
            className={`py-2 px-4 focus:outline-none ${
              activeTab === 'agents' 
                ? 'border-b-2 border-blue-500 font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('agents')}
          >
            AI Agents & Consensus
          </button>
        </div>
      </div>

      {/* Process Flow View */}
      {activeTab === 'process' && (
        <>
          {/* Task Creation */}
          <div className="mb-8">
            <h3 className="font-medium text-lg mb-4">Task Creation and Monitoring</h3>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <h4 className="font-medium">Task Creation</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                The task was created on-chain with the following parameters:
              </p>
              <div className="bg-white rounded p-3 border border-gray-200 text-sm font-mono overflow-auto">
                taskId: {task.id}<br />
                name: "{task.name}"<br />
                taskCreatedBlock: {task.taskCreatedBlock}<br />
                consensusThreshold: {task.consensusThreshold}%<br />
                minimumResponses: {task.minimumResponses}
              </div>
            </div>
            
            {/* Consensus Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium mb-2">Minimum Required Responses</h4>
                <div className="relative pt-1">
                  <div className="text-gray-600 text-xs mb-1">
                    {task.currentResponses} of {task.minimumResponses} responses received
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                      style={{ width: `${getResponsesProgress()}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium mb-2">Current Consensus</h4>
                <div className="relative pt-1">
                  <div className="text-gray-600 text-xs mb-1">
                    {getConsensusProgress()}% YES consensus (threshold: {task.consensusThreshold}%)
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div 
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                        getConsensusProgress() >= task.consensusThreshold ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${getConsensusProgress()}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Sources */}
          <div className="mb-8">
            <h3 className="font-medium text-lg mb-4">Data Sources for AI Agents</h3>
            <p className="text-sm text-gray-600 mb-4">
              AI Agents analyze data from these sources to determine their responses:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dataSources.map((source) => (
                <div 
                  key={source.id}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleSourceClick(source)}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{source.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      source.type === 'primary' ? 'bg-green-100 text-green-800' :
                      source.type === 'secondary' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {source.type === 'primary' ? 'Primary' : 
                      source.type === 'secondary' ? 'Secondary' : 'Fallback'}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm text-gray-500 mb-1">Reliability: {source.reliability}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          source.reliability > 80 ? 'bg-green-500' :
                          source.reliability > 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${source.reliability}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Method */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-lg mb-2">Resolution Method</h3>
            <div className="space-y-3">
              <p className="text-gray-600 text-sm">
                <strong>Multi-agent consensus:</strong> Multiple AI agents analyze the same data independently and submit their responses.
              </p>
              <p className="text-gray-600 text-sm">
                <strong>Threshold requirement:</strong> At least {minimumResponses} agents must respond, and {consensusThreshold}% must agree for a result to be considered valid.
              </p>
              <p className="text-gray-600 text-sm">
                <strong>Reward distribution:</strong> Agents who contributed to the consensus receive rewards based on their stake and contribution.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Agents View */}
      {activeTab === 'agents' && (
        <div className="mb-8">
          <h3 className="font-medium text-lg mb-4">AI Agents</h3>
          <p className="text-sm text-gray-600 mb-4">
            These decentralized AI agents are monitoring this task and providing responses:
          </p>
          
          <table className="min-w-full bg-white border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="py-2 px-4 border text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-2 px-4 border text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reliability</th>
                <th className="py-2 px-4 border text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                <th className="py-2 px-4 border text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {agents.map((agent) => (
                <tr 
                  key={agent.id} 
                  className={`${getAgentStatusColor(agent)} hover:bg-gray-50 cursor-pointer`}
                  onClick={() => handleAgentClick(agent)}
                >
                  <td className="py-2 px-4 border">
                    <div className="text-sm font-medium">{agent.address}</div>
                  </td>
                  <td className="py-2 px-4 border">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border">
                    <div className="flex items-center">
                      <div className="text-sm">{agent.reliability}%</div>
                    </div>
                  </td>
                  <td className="py-2 px-4 border">
                    {agent.hasResponded ? (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        agent.response === 'YES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {agent.response}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">Pending</span>
                    )}
                  </td>
                  <td className="py-2 px-4 border">
                    {agent.hasResponded ? (
                      <span className="text-sm">{agent.responseTime}s</span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Technical Implementation:</strong> Each agent uses the OpenRouterBackend to generate responses based on provided data and signs their response using their private key.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Source Details Modal */}
      {showSourceDetails && selectedSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{selectedSource.name}</h3>
              <button 
                onClick={() => setShowSourceDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Type</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedSource.type === 'primary' ? 'bg-green-100 text-green-800' :
                  selectedSource.type === 'secondary' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedSource.type === 'primary' ? 'Primary' : 
                   selectedSource.type === 'secondary' ? 'Secondary' : 'Fallback'}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Reliability</span>
                <span className="font-medium">{selectedSource.reliability}%</span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{selectedSource.description}</p>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowSourceDetails(false)} 
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Details Modal */}
      {showAgentDetails && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Agent Details</h3>
              <button 
                onClick={() => setShowAgentDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                <div>Address: {selectedAgent.address}</div>
                <div>Status: {selectedAgent.status}</div>
                <div>Reliability: {selectedAgent.reliability}%</div>
                {selectedAgent.hasResponded && (
                  <>
                    <div>Response: {selectedAgent.response}</div>
                    <div>Response Time: {selectedAgent.responseTime}s</div>
                  </>
                )}
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">How This Agent Works</h4>
                <p className="text-sm text-gray-700 mb-2">
                  This AI agent uses a LLM (Large Language Model) to analyze data from multiple sources and predict the market outcome.
                </p>
                <p className="text-sm text-gray-700">
                  The agent monitors for new tasks, generates a response, signs it with its private key, and submits it to the Oracle contract.
                </p>
              </div>
              
              {selectedAgent.hasResponded && selectedAgent.response && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Response Process</h4>
                  <div className="text-sm space-y-2">
                    <p>1. Received task: "{task.name}"</p>
                    <p>2. Generated prompt for LLM analysis</p>
                    <p>3. LLM provided the response: <span className="font-semibold">{selectedAgent.response}</span></p>
                    <p>4. Response signed and submitted to oracle contract</p>
                    <p>5. Transaction confirmed on block {task.taskCreatedBlock + 12}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowAgentDetails(false)} 
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OracleLogicVisualizer; 