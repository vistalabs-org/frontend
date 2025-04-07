"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMarketByIndex } from '@/hooks/fetchMarkets';
import { useOracleTask, useCreateTask, useRegisteredAgents, TaskData, AgentData } from '@/hooks/useOracleData';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, Info, BookOpen, Users, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';

// Helper function returns standard variants
const getStatusInfo = (status: number): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
  switch (status) {
    case 0: return { text: "Created", variant: "secondary" };
    case 1: return { text: "In Progress", variant: "default" };
    case 2: return { text: "Resolved", variant: "default" }; // Use default, icon indicates success
    default: return { text: "Unknown", variant: "outline" };
  }
};

const getAgentStatusInfo = (status: number): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
  switch (status) {
    case 0: return { text: "Inactive", variant: "outline" };
    case 1: return { text: "Active", variant: "default" }; // Use default, icon indicates active
    case 2: return { text: "Suspended", variant: "destructive" };
    default: return { text: "Unknown", variant: "secondary" };
  }
};

export default function MarketResolutionClient() {
  const params = useParams();
  const router = useRouter();
  const marketId = typeof params.id === 'string' ? params.id : '';

  const [taskId, setTaskId] = useState<number | undefined>(undefined);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'process'>('overview');

  // Use 'error' property from hooks
  const { market, isLoading: marketLoading, error: marketError } = useMarketByIndex(marketId);
  const { task, loading: taskLoading, error: taskError } = useOracleTask(taskId);
  const { createTask, isLoading: createTaskLoading, isSuccess: createTaskSuccess } = useCreateTask();
  const { agents, loading: agentsLoading, error: agentsError } = useRegisteredAgents();

  const handleCreateTask = async () => {
    if (market && !isCreatingTask && !createTaskLoading) {
      setIsCreatingTask(true);
      try {
        await createTask(market.title);
      } catch (error) {
        console.error("Failed to create task:", error);
        setIsCreatingTask(false);
      }
    }
  };

  useEffect(() => {
    if (createTaskSuccess) {
      console.log("Task creation successful, simulating taskId fetch...");
      setTaskId(Math.floor(Math.random() * 1000));
      setIsCreatingTask(false);
    }
  }, [createTaskSuccess]);

  const getConsensusProgress = (): number => {
    if (!task || !task.respondents || task.respondents.length === 0) return 0;
    return task.status === 2 ? 75 : 40; // Simplified
  };

  const getResponsesProgress = (): number => {
    if (!task || !task.respondents) return 0;
    const minimumResponses = 5;
    return Math.min(100, Math.round((task.respondents.length / minimumResponses) * 100));
  };

  if (marketLoading) {
    return (
      <main className="max-w-screen-xl mx-auto p-6 min-h-screen flex items-center justify-center">
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <p>Loading market data...</p>
        </div>
      </main>
    );
  }

  // Check for marketError
  if (marketError || !market) {
    return (
      <main className="max-w-screen-xl mx-auto p-6 min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Market</AlertTitle>
          <AlertDescription>
            Failed to load market data. {marketError?.message || `Market ID ${marketId} might be invalid or there was a network issue.`}
          </AlertDescription>
          <div className="mt-4">
            <Link href="/" passHref>
              <Button variant="outline">Back to Markets</Button>
            </Link>
          </div>
        </Alert>
      </main>
    );
  }

  const taskStatusInfo = task ? getStatusInfo(task.status) : getStatusInfo(-1);

  return (
    <main className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Market Resolution</h1>
        <Link href={`/${marketId}`} passHref>
          <Button variant="outline">Back to Market</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{market.title}</CardTitle>
          <CardDescription>{market.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">End Date</p>
              <p>{new Date(Number(market.endTimestamp) * 1000).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              {task ? (
                <Badge variant={taskStatusInfo.variant}>
                  {taskStatusInfo.variant === 'default' && task.status === 2 && <CheckCircle className="mr-1 h-3 w-3 text-green-600" />} {/* Specific styling for Resolved icon */}
                  {taskStatusInfo.text}
                </Badge>
              ) : (
                <Badge variant="outline">Not Submitted</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="process">Oracle Process</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Resolution Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {taskId === undefined ? (
                // Use standard 'default' variant for info
                <Alert variant="default">
                   <Info className="h-4 w-4" />
                  <AlertTitle>Create Oracle Task</AlertTitle>
                  <AlertDescription>
                    This market has not been submitted to the AI Oracle yet. Create a new task to begin the resolution process.
                  </AlertDescription>
                  <div className="mt-4">
                    <Button
                      onClick={handleCreateTask}
                      disabled={isCreatingTask || createTaskLoading}
                    >
                      {isCreatingTask || createTaskLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Oracle Task"
                      )}
                    </Button>
                  </div>
                </Alert>
              ) : taskLoading ? (
                 <div className="flex items-center justify-center p-6 text-muted-foreground">
                   <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                   <p>Loading task data...</p>
                 </div>
              // Check for taskError
              ) : taskError || !task ? (
                 <Alert variant="destructive">
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle>Error Loading Task</AlertTitle>
                   <AlertDescription>
                     Failed to load data for task ID: {taskId}. {taskError?.message || 'Please try again later.'}
                   </AlertDescription>
                 </Alert>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Task Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Task ID</p>
                          <p className="font-medium">{task.id}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <Badge variant={taskStatusInfo.variant}>
                             {taskStatusInfo.variant === 'default' && task.status === 2 && <CheckCircle className="mr-1 h-3 w-3 text-green-600" />}
                             {taskStatusInfo.text}
                          </Badge>
                        </div>
                      </div>
                       {task.status === 2 && task.consensusResult?.isResolved && (
                         // Use standard 'default' variant + styling for success indication
                         <Alert variant="default" className="mt-4 border-green-500/50 bg-green-50 dark:bg-green-900/20">
                           <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                           <AlertTitle className="text-green-800 dark:text-green-300">Resolution Result</AlertTitle>
                           <AlertDescription className="text-lg font-bold text-green-700 dark:text-green-400">
                             {task.consensusResult.result || "Resolved"}
                           </AlertDescription>
                         </Alert>
                       )}
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Responses</CardTitle>
                        <CardDescription>
                          {task.respondents.length} of 5 required responses
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Progress value={getResponsesProgress()} className="w-full" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Consensus</CardTitle>
                        <CardDescription>
                           {getConsensusProgress()}% consensus (threshold: 70%)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                         {/* Removed invalid indicatorClassName. Use CSS/Tailwind for styling indicator if needed */}
                         <Progress value={getConsensusProgress()} className="w-full" />
                         {/* Example of potential indicator styling (adjust based on actual Progress implementation): */}
                         {/* <Progress value={getConsensusProgress()} className="w-full [&>div]:bg-green-500" /> */}
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Respondents</CardTitle>
                       <CardDescription>Agents who have contributed to the resolution.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {task.respondents.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No agents have responded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {task.respondents.map((address: string, index: number) => (
                            <div key={index} className="flex justify-between items-center p-3 border rounded-md text-sm">
                              <span className="font-mono truncate mr-4">{address}</span>
                               {/* Display the actual consensus result string if resolved, else 'Responded' */}
                               {/* Assuming task.consensusResult.result is the string like 'YES' or 'NO' */}
                               <Badge variant={task.status === 2 && task.consensusResult?.isResolved ? 'default' : 'outline'}>
                                 {task.status === 2 && task.consensusResult?.isResolved ? task.consensusResult.result : 'Responded'}
                               </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="process">
          <Card>
            <CardHeader>
              <CardTitle>Oracle Resolution Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Use standard 'default' variant */}
              <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>How It Works</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
                    <li>A market resolution task is created on the Oracle Service Manager.</li>
                    <li>Multiple AI agents independently research and respond to the task.</li>
                    <li>Responses are collected, and consensus is determined based on a threshold.</li>
                    <li>When enough agents agree, the result is finalized on-chain.</li>
                    <li>Agents that contributed to consensus are rewarded.</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Consensus Mechanism</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Multi-agent verification:</strong> Each AI agent processes the task independently.</p>
                  <p><strong>Threshold requirement:</strong> At least 5 agents must respond, and 70% must agree.</p>
                  <p><strong>Staked verification:</strong> Agents stake tokens to participate, ensuring honest reporting.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data Sources</CardTitle>
                   <CardDescription>AI Agents analyze data from multiple sources.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-md">
                      <div className="flex justify-between items-center mb-1">
                        <h5 className="font-medium text-sm">Official Government Sources</h5>
                        {/* Use standard 'default' variant */}
                        <Badge variant="default">Primary</Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Official statements, websites, and documents published by relevant government bodies.
                      </p>
                    </div>
                     <div className="p-3 border rounded-md">
                       <div className="flex justify-between items-center mb-1">
                         <h5 className="font-medium text-sm">Major News Outlets</h5>
                         {/* Use standard 'secondary' variant */}
                         <Badge variant="secondary">Secondary</Badge>
                       </div>
                       <p className="text-muted-foreground text-xs">
                         Reports from established and reputable news organizations.
                       </p>
                     </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>AI Agents</CardTitle>
              <CardDescription>
                These decentralized AI agents analyze market data and provide resolution consensus. Click on an agent for more details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agentsLoading ? (
                 <div className="flex items-center justify-center p-6 text-muted-foreground">
                   <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                   <p>Loading agents...</p>
                 </div>
              // Check for agentsError
              ) : agentsError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Agents</AlertTitle>
                    <AlertDescription>
                      Failed to load the list of registered AI agents. {agentsError?.message || 'Please try again later.'}
                    </AlertDescription>
                  </Alert>
              ) : !agents || agents.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No AI agents registered.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Assuming agents array contains objects compatible with AgentData */}
                  {agents.map((agent: AgentData, index: number) => {
                     const agentStatusInfo = getAgentStatusInfo(agent.status);
                     return (
                       <Dialog key={index}>
                         <DialogTrigger asChild>
                           <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                               <CardTitle className="text-sm font-medium">
                                 {agent.modelType || 'Unknown Model'} v{agent.modelVersion || '?'}
                               </CardTitle>
                               <Badge variant={agentStatusInfo.variant}>
                                  {agentStatusInfo.variant === 'default' && <CheckCircle className="mr-1 h-3 w-3 text-green-600" />} {/* Icon for Active */}
                                  {agentStatusInfo.text}
                                </Badge>
                             </CardHeader>
                             <CardContent className="text-xs text-muted-foreground space-y-1">
                               <p className="truncate">
                                 <span className="font-medium text-foreground">Address: </span>
                                 <span className="font-mono">{agent.address ? `${agent.address.substring(0, 6)}...${agent.address.substring(agent.address.length - 4)}` : 'N/A'}</span>
                               </p>
                               <p>
                                 <span className="font-medium text-foreground">Tasks: </span>
                                 {agent.tasksCompleted ?? 'N/A'}
                               </p>
                               <p>
                                 <span className="font-medium text-foreground">Consensus: </span>
                                 {agent.consensusParticipations ?? 'N/A'}
                               </p>
                               <p>
                                 <span className="font-medium text-foreground">Rewards: </span>
                                 {agent.rewardsEarned ?? 'N/A'}
                               </p>
                             </CardContent>
                           </Card>
                         </DialogTrigger>
                         <DialogContent className="sm:max-w-[525px]">
                           <DialogHeader>
                             <DialogTitle>{agent.modelType} v{agent.modelVersion}</DialogTitle>
                             <DialogDescription>
                               Details and performance metrics for this AI agent.
                             </DialogDescription>
                           </DialogHeader>
                           <div className="grid gap-4 py-4">
                             <Card>
                               <CardContent className="pt-6 grid grid-cols-2 gap-4 text-sm">
                                 <div>
                                   <p className="text-muted-foreground">Address</p>
                                   <p className="font-mono break-all">{agent.address}</p>
                                 </div>
                                  <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <Badge variant={agentStatusInfo.variant}>
                                       {agentStatusInfo.variant === 'default' && <CheckCircle className="mr-1 h-3 w-3 text-green-600" />}
                                       {agentStatusInfo.text}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Tasks Completed</p>
                                    <p>{agent.tasksCompleted}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Consensus Participations</p>
                                    <p>{agent.consensusParticipations}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-muted-foreground">Rewards Earned</p>
                                    <p>{agent.rewardsEarned}</p>
                                  </div>
                                </CardContent>
                             </Card>
                              {/* Use standard 'default' variant */}
                             <Alert variant="default">
                                <Info className="h-4 w-4" />
                                <AlertTitle>How This Agent Works</AlertTitle>
                                <AlertDescription className="text-sm">
                                   This AI agent uses a {agent.modelType} model to analyze data and predict outcomes. It monitors tasks, generates signed responses, and submits them to the Oracle contract.
                                </AlertDescription>
                             </Alert>
                             <Card>
                                <CardHeader>
                                   <CardTitle className="text-base">Recent Performance</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                   <div>
                                     <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium">Accuracy Rate</span>
                                        <span className="text-sm text-muted-foreground">92%</span>
                                     </div>
                                     {/* Example styling for success progress */}
                                     <Progress value={92} className="[&>div]:bg-green-500" />
                                   </div>
                                   <div>
                                     <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium">Response Time (avg)</span>
                                        <span className="text-sm text-muted-foreground">78 sec</span>
                                     </div>
                                     <Progress value={78} />
                                   </div>
                                </CardContent>
                             </Card>
                           </div>
                           <DialogFooter>
                             <DialogClose asChild>
                               <Button type="button" variant="outline">
                                 Close
                               </Button>
                             </DialogClose>
                           </DialogFooter>
                         </DialogContent>
                       </Dialog>
                     );
                   })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </main>
  );
} 