import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useConfig } from 'wagmi';
import { readContract } from '@wagmi/core'; // Import readContract for non-hook usage
import { AIOracleServiceManagerABI } from '@/contracts/AIOracleServiceManager';
import { AIAgentRegistryABI } from '@/contracts/AIAgentRegistry';
// AIAgentABI seems unused in the original hook, but keep import if needed elsewhere
// import { AIAgentABI } from '@/contracts/AIAgentABI'; 
import { ORACLE_SERVICE_MANAGER_ADDRESS, AGENT_REGISTRY_ADDRESS } from '@/app/constants';
import { type Abi } from 'viem'; // Import Abi type

// Define interfaces for better type safety
interface TaskData {
    id: number;
    // Map status number to a string representation later if needed
    status: number; 
    respondents: readonly `0x${string}`[];
    consensusResult: {
        result: `0x${string}`;
        isResolved: boolean;
    } | null; // Allow null if not fetched/available
}

interface AgentDetails {
    modelType: string;
    modelVersion: string;
    tasksCompleted: bigint;
    consensusParticipations: bigint;
    rewardsEarned: bigint;
    // Add status if needed from AIAgentABI or Registry
}

interface Agent {
    address: `0x${string}`;
    details: AgentDetails | null; // Allow null if details couldn't be fetched
    // Add other relevant agent properties if needed
}

// Hook to get the latest task number
export function useLatestTaskNum() {
    const { data: latestTaskNum, isLoading, error } = useReadContract({
        address: ORACLE_SERVICE_MANAGER_ADDRESS,
        abi: AIOracleServiceManagerABI as Abi,
        functionName: 'latestTaskNum',
    });

    return { 
        latestTaskNum: latestTaskNum !== undefined ? Number(latestTaskNum) : undefined, 
        isLoading, 
        error 
    };
}


// Hook to get task data from the Oracle
export function useOracleTask(taskId: number | undefined) {
    const [task, setTask] = useState<TaskData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const commonReadConfig = {
        address: ORACLE_SERVICE_MANAGER_ADDRESS,
        abi: AIOracleServiceManagerABI as Abi,
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
        setLoading(true); // Reset loading state on taskId change
        setError(null); // Reset error state

        if (statusError || respondentsError || consensusError) {
            setError(statusError || respondentsError || consensusError || new Error("Failed to fetch task data"));
            setLoading(false);
            setTask(null); // Clear task data on error
            return;
        }

        // Only update task when taskId is defined and all required data is available
        if (taskId !== undefined && taskStatus !== undefined && respondents !== undefined && consensusResultData !== undefined) {
            // Ensure consensusResultData is structured correctly before accessing properties
             const consensusResult = Array.isArray(consensusResultData) && consensusResultData.length === 2
                ? { result: consensusResultData[0] as `0x${string}`, isResolved: consensusResultData[1] as boolean }
                : null; // Handle potential malformed data

            setTask({
                id: taskId,
                // Assuming taskStatus returns a number (uint8)
                status: Number(taskStatus), 
                respondents: respondents as readonly `0x${string}`[],
                consensusResult: consensusResult,
            });
            setLoading(false);
        } else if (taskId === undefined) {
            // Handle case where taskId is initially undefined or becomes undefined
            setTask(null);
            setLoading(false); 
        }
        // If taskId is defined but data is still loading (undefined), loading remains true
        // until data arrives or an error occurs.

    }, [taskId, taskStatus, respondents, consensusResultData, statusError, respondentsError, consensusError]);

    return { task, loading, error };
}

// Hook to create a new task
export function useCreateTask() {
    const { writeContract, isPending, isSuccess, isError, error, data } = useWriteContract();

    const createTask = (marketQuestion: string) => {
        writeContract({
            address: ORACLE_SERVICE_MANAGER_ADDRESS,
            abi: AIOracleServiceManagerABI as Abi,
            functionName: 'createNewTask',
            args: [marketQuestion],
        });
    };
    
    // data might contain the transaction hash upon initiation
    return { createTask, isLoading: isPending, isSuccess, isError, error, transactionHash: data };
}

// Hook to get all registered agents and their details
export function useRegisteredAgents() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const config = useConfig(); // Get wagmi config for readContract

    const { data: agentAddresses, error: addressesError, isLoading: addressesLoading } = useReadContract({
        address: AGENT_REGISTRY_ADDRESS,
        abi: AIAgentRegistryABI as Abi,
        functionName: 'getAllAgents',
    });

    // Helper function to get agent details using readContract
    const getAgentDetails = async (address: `0x${string}`): Promise<AgentDetails | null> => {
       try {
            const data = await readContract(config, {
                address: AGENT_REGISTRY_ADDRESS,
                abi: AIAgentRegistryABI as Abi,
                functionName: 'getAgentDetails',
                args: [address],
            });
             // Ensure data is an array with expected structure
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
            return null; // Return null if data structure is not as expected
       } catch (err) {
           console.error(`Failed to fetch details for agent ${address}:`, err);
           // Propagate error or return null? Returning null for now.
           return null; 
       }
    };


    useEffect(() => {
        const fetchAllAgentDetails = async () => {
            setLoading(true);
            setError(null); // Reset error

            if (addressesError) {
                setError(addressesError);
                setLoading(false);
                setAgents([]); // Clear agents on error
                return;
            }

            const addresses = agentAddresses as readonly `0x${string}`[] | undefined;

            if (addresses && addresses.length > 0) {
                try {
                    const agentDetailsPromises = addresses.map(async (address) => {
                        const details = await getAgentDetails(address);
                        return {
                            address,
                            details, // details can be null if fetch failed
                        };
                    });

                    const resolvedAgents = await Promise.all(agentDetailsPromises);
                    setAgents(resolvedAgents);
                } catch (err) {
                    console.error("Error fetching agent details:", err);
                    // This catch might be redundant if getAgentDetails handles its errors,
                    // but good for safety.
                    setError(err instanceof Error ? err : new Error('Failed to fetch agent details'));
                    setAgents([]); // Clear agents on error
                } finally {
                    setLoading(false);
                }
            } else if (!addressesLoading) { 
                // addresses is defined but empty, or finished loading and is empty/undefined
                setAgents([]);
                setLoading(false);
            }
            // If addressesLoading is true, loading remains true
        };

        fetchAllAgentDetails();
    }, [agentAddresses, addressesError, addressesLoading, config]); // Add config dependency for readContract


    return { agents, loading, error };
} 