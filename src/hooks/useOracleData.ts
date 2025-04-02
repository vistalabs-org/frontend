import { useState, useEffect } from 'react';
// Use the newer import style
import { useReadContract, useWriteContract, useConfig } from 'wagmi';
import { readContract } from '@wagmi/core'; // Import readContract for non-hook usage
import { AIOracleServiceManagerABI } from '@/contracts/AIOracleServiceManagerABI';
import { AIAgentRegistryABI } from '@/contracts/AIAgentRegistryABI';
// Remove AIAgentABI import if unused
// import { AIAgentABI } from '@/contracts/AIAgentABI'; 
import { ORACLE_SERVICE_MANAGER_ADDRESS, AGENT_REGISTRY_ADDRESS } from '@/app/constants';
// Import Address type
import { type Address } from 'viem'; 

// Define interfaces for better type safety
interface TaskData {
    id: number;
    status: number; 
    respondents: readonly `0x${string}`[];
    consensusResult: {
        result: `0x${string}`;
        isResolved: boolean;
    } | null;
}

interface AgentDetails {
    modelType: string;
    modelVersion: string;
    tasksCompleted: bigint;
    consensusParticipations: bigint;
    rewardsEarned: bigint;
}

// Ensure Agent is exported
export interface Agent {
    address: `0x${string}`;
    details: AgentDetails | null;
}

// Hook to get the latest task number
export function useLatestTaskNum() {
    const { data: latestTaskNum, isLoading, error } = useReadContract({
        address: ORACLE_SERVICE_MANAGER_ADDRESS,
        abi: AIOracleServiceManagerABI, // Abi type often inferred
        functionName: 'latestTaskNum',
    });

    return { 
        latestTaskNum: latestTaskNum !== undefined ? Number(latestTaskNum) : undefined, 
        isLoading, 
        error 
    };
}

// Hook to get task data from the Oracle (The newer version)
export function useOracleTask(taskId: number | undefined) {
    const [task, setTask] = useState<TaskData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Assert Address type for the address property
    const commonReadConfig = {
        address: ORACLE_SERVICE_MANAGER_ADDRESS as Address, 
        abi: AIOracleServiceManagerABI, // Abi type often inferred
    };

    const { data: taskStatus, error: statusError } = useReadContract({
        ...commonReadConfig,
        functionName: 'taskStatus',
        args: taskId !== undefined ? [BigInt(taskId)] : undefined,
        query: { enabled: taskId !== undefined },
    });

    const { data: respondents, error: respondentsError } = useReadContract({
        ...commonReadConfig,
        functionName: 'taskRespondents',
        args: taskId !== undefined ? [BigInt(taskId)] : undefined,
        query: { enabled: taskId !== undefined },
    });

    const { data: consensusResultData, error: consensusError } = useReadContract({
        ...commonReadConfig,
        functionName: 'getConsensusResult',
        args: taskId !== undefined ? [BigInt(taskId)] : undefined,
        query: { enabled: taskId !== undefined },
    });

    useEffect(() => {
        setLoading(true); 
        setError(null); 

        if (statusError || respondentsError || consensusError) {
            setError(statusError || respondentsError || consensusError || new Error("Failed to fetch task data"));
            setLoading(false);
            setTask(null);
            return;
        }

        if (taskId !== undefined && taskStatus !== undefined && respondents !== undefined && consensusResultData !== undefined) {
             const consensusResult = Array.isArray(consensusResultData) && consensusResultData.length === 2
                ? { result: consensusResultData[0] as `0x${string}`, isResolved: consensusResultData[1] as boolean }
                : null;

            setTask({
                id: taskId,
                status: Number(taskStatus), 
                respondents: respondents as readonly `0x${string}`[],
                consensusResult: consensusResult,
            });
            setLoading(false);
        } else if (taskId === undefined) {
            setTask(null);
            setLoading(false); 
        }

    }, [taskId, taskStatus, respondents, consensusResultData, statusError, respondentsError, consensusError]);

    return { task, loading, error };
}


// Hook to create a new task (The newer version)
export function useCreateTask() {
    const { writeContract, isPending, isSuccess, isError, error, data } = useWriteContract();

    const createTask = (marketQuestion: string) => {
        writeContract({
            address: ORACLE_SERVICE_MANAGER_ADDRESS,
            abi: AIOracleServiceManagerABI, // Abi type often inferred
            functionName: 'createNewTask',
            args: [marketQuestion],
        });
    };
    
    return { createTask, isLoading: isPending, isSuccess, isError, error, transactionHash: data };
}

// Hook to get all registered agents and their details (The newer version)
export function useRegisteredAgents() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const config = useConfig(); 

    const { data: agentAddresses, error: addressesError, isLoading: addressesLoading } = useReadContract({
        address: AGENT_REGISTRY_ADDRESS,
        abi: AIAgentRegistryABI, // Abi type often inferred
        functionName: 'getAllAgents',
    });

    const getAgentDetails = async (address: `0x${string}`): Promise<AgentDetails | null> => {
       try {
            const data = await readContract(config, {
                address: AGENT_REGISTRY_ADDRESS,
                abi: AIAgentRegistryABI, // Abi type often inferred
                functionName: 'getAgentDetails',
                args: [address],
            });
            if (Array.isArray(data) && data.length === 5) {
                 return {
                    modelType: data[0] as string,
                    modelVersion: data[1] as string,
                    tasksCompleted: data[2] as bigint,
                    consensusParticipations: data[3] as bigint,
                    rewardsEarned: data[4] as bigint,
                };
            }
            console.warn(`Unexpected data structure for agent ${address}:`, data);
            return null; 
       } catch (err) {
           console.error(`Failed to fetch details for agent ${address}:`, err);
           return null; 
       }
    };

    useEffect(() => {
        const fetchAllAgentDetails = async () => {
            setLoading(true);
            setError(null); 

            if (addressesError) {
                setError(addressesError);
                setLoading(false);
                setAgents([]); 
                return;
            }

            const addresses = agentAddresses as readonly `0x${string}`[] | undefined;

            if (addresses && addresses.length > 0) {
                try {
                    const agentDetailsPromises = addresses.map(async (address) => {
                        const details = await getAgentDetails(address);
                        return {
                            address,
                            details,
                        };
                    });

                    const resolvedAgents = await Promise.all(agentDetailsPromises);
                    setAgents(resolvedAgents);
                } catch (err) {
                    console.error("Error fetching agent details:", err);
                    setError(err instanceof Error ? err : new Error('Failed to fetch agent details'));
                    setAgents([]); 
                } finally {
                    setLoading(false);
                }
            } else if (!addressesLoading) { 
                setAgents([]);
                setLoading(false);
            }
        };

        fetchAllAgentDetails();
    }, [agentAddresses, addressesError, addressesLoading, config]); 

    return { agents, loading, error };
} 