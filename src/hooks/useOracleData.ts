import { useState, useEffect } from 'react';
import { useContractRead, useContractWrite } from 'wagmi';
import { AIOracleServiceManagerABI } from '@/contracts/AIOracleServiceManagerABI';
import { AIAgentRegistryABI } from '@/contracts/AIAgentRegistryABI';
import { AIAgentABI } from '@/contracts/AIAgentABI';
import { ORACLE_SERVICE_MANAGER_ADDRESS, AGENT_REGISTRY_ADDRESS } from '@/app/constants';

// Hook to get task data from the Oracle
export function useOracleTask(taskId: string | number | undefined) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: taskStatus } = useContractRead({
    address: ORACLE_SERVICE_MANAGER_ADDRESS,
    abi: AIOracleServiceManagerABI,
    functionName: 'taskStatus',
    args: taskId !== undefined ? [Number(taskId)] : undefined,
    enabled: taskId !== undefined,
  });

  const { data: respondents } = useContractRead({
    address: ORACLE_SERVICE_MANAGER_ADDRESS,
    abi: AIOracleServiceManagerABI,
    functionName: 'taskRespondents',
    args: taskId !== undefined ? [Number(taskId)] : undefined,
    enabled: taskId !== undefined,
  });

  const { data: consensusResult } = useContractRead({
    address: ORACLE_SERVICE_MANAGER_ADDRESS,
    abi: AIOracleServiceManagerABI,
    functionName: 'getConsensusResult',
    args: taskId !== undefined ? [Number(taskId)] : undefined,
    enabled: taskId !== undefined,
  });

  useEffect(() => {
    if (taskId !== undefined && taskStatus !== undefined) {
      setTask({
        id: Number(taskId),
        status: Number(taskStatus),
        respondents: respondents || [],
        consensusResult: consensusResult || { result: "", isResolved: false },
      });
      setLoading(false);
    }
  }, [taskId, taskStatus, respondents, consensusResult]);

  return { task, loading, error };
}

// Hook to create a new task
export function useCreateTask() {
  const { write, isLoading, isSuccess, isError, error, data } = useContractWrite({
    address: ORACLE_SERVICE_MANAGER_ADDRESS,
    abi: AIOracleServiceManagerABI,
    functionName: 'createNewTask',
  });

  const createTask = (marketQuestion: string) => {
    write({ args: [marketQuestion] });
  };

  return { createTask, isLoading, isSuccess, isError, error, data };
}

// Hook to get all registered agents
export function useRegisteredAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: agentAddresses } = useContractRead({
    address: AGENT_REGISTRY_ADDRESS,
    abi: AIAgentRegistryABI,
    functionName: 'getAllAgents',
  });

  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (agentAddresses && agentAddresses.length > 0) {
        try {
          const agentDetailsPromises = agentAddresses.map(async (address) => {
            // Fetch agent details from registry
            const details = await getAgentDetails(address);
            return {
              address,
              ...details,
            };
          });
          
          const agentDetails = await Promise.all(agentDetailsPromises);
          setAgents(agentDetails);
          setLoading(false);
        } catch (err) {
          setError(err);
          setLoading(false);
        }
      } else if (agentAddresses) {
        // No agents found
        setAgents([]);
        setLoading(false);
      }
    };

    fetchAgentDetails();
  }, [agentAddresses]);

  // Helper function to get agent details
  const getAgentDetails = async (address) => {
    // This would be implemented using useContractRead or ethers.js directly
    // For now, returning mock data
    return {
      modelType: "GPT-4",
      modelVersion: "1.0",
      tasksCompleted: 10,
      consensusParticipations: 8,
      rewardsEarned: 5,
      status: 1, // Active
    };
  };

  return { agents, loading, error };
} 