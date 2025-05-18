"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, Calendar, Loader2, ChevronDown, Folder } from "lucide-react";
import { formatDistanceToNow, format } from 'date-fns';
import { Event } from "@/app/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, useSpring } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MultiselectDropdown } from "@/components/ui/MultiselectDropdown";
import { Label } from "@/components/ui/label";
import { Circle, CircleCheck } from "lucide-react";
import { FinanceStatus, FINANCE_STATUS_LABELS, FINANCE_STATUS_COLORS } from "@/app/types";
import { FinanceTemplateSelect } from "@/components/ui/FinanceTemplateSelect";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface EventFinanceProps {
  event: Event;
}

interface DriveFile {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  parentFolderId: string;
  parentFolderName: string;
}

interface FinanceTemplate {
  label: string;
  value: string;
  url: string;
}

interface EventTracker {
  fin_drive_id: string | null;
  fin_preacts_status: string;
  fin_postacts_status: string;
  fin_preacts_deadline: string | null;
  fin_postacts_deadline: string | null;
}

interface FinanceProcess {
  process: string;
  name: string;
}

const FINANCE_PROCESSES = [
  { id: 'SPF', name: 'Student Procurement Form' },
  { id: 'CRF', name: 'Canteen Request Form' },
  { id: 'NE', name: 'No Expense' },
  { id: 'LOE', name: 'List of Expense' },
  { id: 'DP-C', name: 'Direct Payment (Concessionaires)' },
  { id: 'DP-P', name: 'Direct Payment (Procurement)' },
  { id: 'DP-S', name: 'Direct Payment (Student)' },
  { id: 'DP-SR', name: 'Direct Payment (Student) - Reimbursement' },
  { id: 'DP-O', name: 'Direct Payment (Others)' },
  { id: 'BT', name: 'Book Transfer' },
];

// Sample data for now
const sampleBudget = 50000.00;
const sampleFinanceProcesses = ["DP-P", "NE"];
const sampleFiles: DriveFile[] = [
  {
    id: "1",
    name: "Budget Proposal.pdf",
    url: "#",
    mimeType: "application/pdf",
    parentFolderId: "root",
    parentFolderName: "root",
  },
  {
    id: "2",
    name: "Expense Report.xlsx",
    url: "#",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    parentFolderId: "root",
    parentFolderName: "root",
  }
];

const statusColorMap = {
  // Green statuses
  FULLINCENTIVE: 'bg-green-500 text-white',
  EARLYAPPROVAL: 'bg-green-500 text-white',
  EARLYCOMP: 'bg-green-500 text-white',
  HALFINCENTIVE: 'bg-green-500 text-white',
  LATEINC: 'bg-green-500 text-white',
  
  // Orange statuses
  REVISE: 'bg-orange-500 text-white',
  
  // Yellow statuses
  AVP: 'bg-yellow-500 text-white',
  SENT: 'bg-yellow-500 text-white',
  DOCU: 'bg-yellow-500 text-white',
  SIGNATURES: 'bg-yellow-500 text-white',
  
  // Red statuses
  DENIED: 'bg-red-500 text-white',
  CANCELLED: 'bg-red-500 text-white',
  
  // Grey statuses (default)
  INIT: 'bg-gray-500 text-white',
  PENDED: 'bg-gray-500 text-white',
  HOLD: 'bg-gray-500 text-white',
  UNCPEND: 'bg-gray-500 text-white',
  SPECIAL: 'bg-gray-500 text-white',
  DEFAULT: 'bg-gray-500 text-white',
  SUBMITTED: 'bg-gray-500 text-white',
  LATEAPPROVAL: 'bg-gray-500 text-white',
  LATECOMP: 'bg-gray-500 text-white',
  EARLYINC: 'bg-gray-500 text-white',
};

const statusLabels = {
  INIT: 'Not Started',
  AVP: 'Drafting',
  SENT: 'Sent for Review',
  DOCU: 'In Review',
  REVISE: 'For Revision',
  SIGNATURES: 'Collecting Signatures',
  SUBMITTED: 'Submitted to CSO/SLIFE',
  FULLINCENTIVE: 'Full Incentive',
  HALFINCENTIVE: 'Half Incentive',
  EARLYAPPROVAL: 'Early Approved',
  LATEAPPROVAL: 'Late Approved',
  EARLYCOMP: 'Early Complete',
  EARLYINC: 'Early Incomplete',
  LATECOMP: 'Late Complete',
  LATEINC: 'Late Incomplete',
  SPECIAL: 'Special',
  DEFAULT: 'Default',
  PENDED: 'Pending',
  UNCPEND: 'Uncounted Pend',
  DENIED: 'Denied',
  HOLD: 'On Hold',
  CANCELLED: 'Cancelled',
};

// Add sample deadlines
const samplePreactsDeadline = new Date('2024-04-15');
const samplePostactsDeadline = new Date('2024-05-01');
const sampleFinanceHead = {
  name: "John Doe",
  email: "john.doe@example.com"
};

export function EventFinance({ event }: EventFinanceProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [templates, setTemplates] = useState<FinanceTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [preactsStatus, setPreactsStatus] = useState<string>(event.fin_preacts_status || 'INIT');
  const [postactsStatus, setPostactsStatus] = useState<string>(event.fin_postacts_status || 'INIT');
  const [stepperSteps, setStepperSteps] = useState<any[] | null>(null);
  const [budgetValue, setBudgetValue] = useState(0);
  const [isLoadingPreactsFiles, setIsLoadingPreactsFiles] = useState(false);
  const [isLoadingPostactsFiles, setIsLoadingPostactsFiles] = useState(false);
  const [preactsDeadline, setPreactsDeadline] = useState<string | null>(null);
  const [postactsDeadline, setPostactsDeadline] = useState<string | null>(null);
  const [financeProcesses, setFinanceProcesses] = useState<FinanceProcess[]>([]);
  const [isLoadingProcesses, setIsLoadingProcesses] = useState(false);
  const { data: session } = useSession();
  const isFinance = session?.user?.committeeId?.toString() === 'FIN';

  // Budget animation
  const budget = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: 2000
  });

  useEffect(() => {
    const targetBudget = event.budget_allocation || 0;
    budget.set(targetBudget);
    setBudgetValue(targetBudget);
  }, [event.budget_allocation, budget]);

  // Load finance files or templates
  useEffect(() => {
    let isMounted = true;

    const loadFinanceData = async () => {
      if (event.id) {
        setIsLoadingFiles(true);
        try {
          // First, get the tracker data
          const trackerResponse = await fetch(`/api/events/tracker?eventId=${event.id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (!trackerResponse.ok) {
            throw new Error(`HTTP error! status: ${trackerResponse.status}`);
          }
          
          const trackerData = await trackerResponse.json();
          
          // Update tracker-related states
          setPreactsDeadline(trackerData.fin_preacts_deadline);
          setPostactsDeadline(trackerData.fin_postacts_deadline);
          setPreactsStatus(trackerData.fin_preacts_status || 'INIT');
          setPostactsStatus(trackerData.fin_postacts_status || 'INIT');

          // If we have a fin_drive_id, fetch the files
          if (trackerData.fin_drive_id) {
            const filesResponse = await fetch(`/api/events/finance-files?folderId=${trackerData.fin_drive_id}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            });

            if (!filesResponse.ok) {
              throw new Error(`HTTP error! status: ${filesResponse.status}`);
            }

            const filesData = await filesResponse.json();
            if (isMounted) {
              setFiles(filesData.files || []);
            }
          } else {
            // If no fin_drive_id, clear files
            setFiles([]);
          }
        } catch (error) {
          console.error('Error loading finance data:', error);
        } finally {
          if (isMounted) {
            setIsLoadingFiles(false);
          }
        }
      } else if (!event.id && templates.length === 0 && !isLoadingTemplates) {
        setIsLoadingTemplates(true);
        try {
          const response = await fetch('/api/finance-templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          if (data.files && isMounted) {
            setTemplates(data.files.map((file: any) => ({
              label: file.name,
              value: file.id,
              url: file.url
            })));
          }
        } catch (error) {
          console.error('Error loading finance templates:', error);
        } finally {
          if (isMounted) {
            setIsLoadingTemplates(false);
          }
        }
      }
    };

    loadFinanceData();

    return () => {
      isMounted = false;
    };
  }, [event.id]); // Only depend on event.id

  // Load finance processes
  useEffect(() => {
    const loadFinanceProcesses = async () => {
      if (event.id) {
        setIsLoadingProcesses(true);
        try {
          const response = await fetch(`/api/events/finance-processes?eventId=${event.id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch finance processes');
          }
          const data = await response.json();
          setFinanceProcesses(data.processes || []);
        } catch (error) {
          console.error('Error loading finance processes:', error);
        } finally {
          setIsLoadingProcesses(false);
        }
      }
    };

    loadFinanceProcesses();
  }, [event.id]);

  const handlePreactsStatusChange = async (newStatus: string) => {
    if (!isFinance) {
      toast.error('Only Finance committee members can update status');
      return;
    }

    try {
      const response = await fetch('/api/update-fin-preacts-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setPreactsStatus(newStatus);
      toast.success('Pre-Acts status updated successfully');
    } catch (error) {
      console.error('Error updating pre-acts status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handlePostactsStatusChange = async (newStatus: string) => {
    if (!isFinance) {
      toast.error('Only Finance committee members can update status');
      return;
    }

    try {
      const response = await fetch('/api/update-fin-postacts-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setPostactsStatus(newStatus);
      toast.success('Post-Acts status updated successfully');
    } catch (error) {
      console.error('Error updating post-acts status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handleGenerateFolder = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/generate-finance-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: event.event_name,
          templateIds: selectedTemplates,
          eventId: event.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate finance folder');
      }

      const data = await response.json();
      setStepperSteps(data.steps);
    } catch (error: any) {
      console.error('Error generating finance folder:', error);
      // You might want to show this error to the user via a toast or alert
      alert(error.message || 'Failed to generate finance folder');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddProcess = async (processId: string) => {
    try {
      const response = await fetch('/api/events/finance-processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, process: processId })
      });

      if (!response.ok) {
        throw new Error('Failed to add finance process');
      }

      // Refresh the processes list
      const processesResponse = await fetch(`/api/events/finance-processes?eventId=${event.id}`);
      const data = await processesResponse.json();
      setFinanceProcesses(data.processes || []);
    } catch (error) {
      console.error('Error adding finance process:', error);
    }
  };

  const handleRemoveProcess = async (processId: string) => {
    try {
      const response = await fetch(`/api/events/finance-processes?eventId=${event.id}&process=${processId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove finance process');
      }

      // Refresh the processes list
      const processesResponse = await fetch(`/api/events/finance-processes?eventId=${event.id}`);
      const data = await processesResponse.json();
      setFinanceProcesses(data.processes || []);
    } catch (error) {
      console.error('Error removing finance process:', error);
    }
  };

  const renderFileList = () => {
    if (isLoadingFiles) {
      return (
        <div className="space-y-4">
          <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
          <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
          <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
        </div>
      );
    }

    if (files.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No files found in Finance folder</p>;
    }

    // Group files by their parent folder
    const filesByFolder = files.reduce((acc, file) => {
      const folderName = file.parentFolderName;
      if (!acc[folderName]) acc[folderName] = [];
      acc[folderName].push(file);
      return acc;
    }, {} as Record<string, DriveFile[]>);

    return (
      <div className="space-y-6">
        {Object.entries(filesByFolder).map(([folderName, folderFiles]) => (
          <div key={folderName} className="space-y-3">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-primary" />
              <Badge variant="outline" className="text-sm font-medium">
                {folderName}
              </Badge>
            </div>
            <div className="pl-6 space-y-3">
              {folderFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:text-muted-foreground transition-colors"
                    >
                      {file.name}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        {/* Budget Allocation Section */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Budget Allocation</h3>
            <motion.p className="text-3xl font-bold text-primary">
              ₱{budgetValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </motion.p>
            <div className="flex flex-wrap gap-2 mt-2">
              {isLoadingProcesses ? (
                <div className="h-6 w-24 animate-pulse bg-muted rounded-md" />
              ) : financeProcesses.length > 0 ? (
                <>
                  {financeProcesses.map((process) => (
                    <Badge 
                      key={process.process}
                      variant="secondary"
                      className={isFinance ? "cursor-pointer hover:bg-destructive hover:text-destructive-foreground" : ""}
                      onClick={() => isFinance && handleRemoveProcess(process.process)}
                    >
                      {process.name}
                    </Badge>
                  ))}
                  {isFinance && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Badge variant="outline" className="cursor-pointer">
                          +
                        </Badge>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {FINANCE_PROCESSES.map((process) => (
                          <DropdownMenuItem
                            key={process.id}
                            onClick={() => handleAddProcess(process.id)}
                            disabled={financeProcesses.some(p => p.process === process.id)}
                          >
                            {process.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              ) : isFinance ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge variant="outline" className="cursor-pointer">
                      + Add Processes
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {FINANCE_PROCESSES.map((process) => (
                      <DropdownMenuItem
                        key={process.id}
                        onClick={() => handleAddProcess(process.id)}
                      >
                        {process.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <p className="text-sm text-muted-foreground">No finance processes added yet</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start gap-6">
            {/* Status Buttons */}
            <div className="flex items-start gap-4">
              {/* Pre-Acts Status */}
              <div className="flex flex-col items-start gap-1">
                <span className="text-sm font-medium text-muted-foreground">Pre-Acts Status</span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Due {preactsDeadline ? format(new Date(preactsDeadline), 'MMM d, yyyy') : 'Not set'}</span>
                </div>
                {isFinance ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="secondary"
                        size="sm"
                        className={`${FINANCE_STATUS_COLORS[preactsStatus as FinanceStatus] || 'bg-gray-500 text-white'} hover:opacity-90`}
                      >
                        {FINANCE_STATUS_LABELS[preactsStatus as FinanceStatus] || preactsStatus}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {Object.entries(FINANCE_STATUS_LABELS).map(([key, label]) => (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => handlePreactsStatusChange(key)}
                          className="flex items-center justify-between"
                        >
                          <Badge 
                            variant="secondary" 
                            className={`ml-2 ${FINANCE_STATUS_COLORS[key as FinanceStatus] || 'bg-gray-500 text-white'}`}
                          >
                            {label}
                          </Badge>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    variant="secondary"
                    size="sm"
                    className={`${FINANCE_STATUS_COLORS[preactsStatus as FinanceStatus] || 'bg-gray-500 text-white'} cursor-default pointer-events-none`}
                    onClick={(e) => e.preventDefault()}
                  >
                    {FINANCE_STATUS_LABELS[preactsStatus as FinanceStatus] || preactsStatus}
                  </Button>
                )}
              </div>

              {/* Post-Acts Status */}
              <div className="flex flex-col items-start gap-1">
                <span className="text-sm font-medium text-muted-foreground">Post-Acts Status</span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Due {postactsDeadline ? format(new Date(postactsDeadline), 'MMM d, yyyy') : 'Not set'}</span>
                </div>
                {isFinance ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="secondary"
                        size="sm"
                        className={`${FINANCE_STATUS_COLORS[postactsStatus as FinanceStatus] || 'bg-gray-500 text-white'} hover:opacity-90`}
                      >
                        {FINANCE_STATUS_LABELS[postactsStatus as FinanceStatus] || postactsStatus}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {Object.entries(FINANCE_STATUS_LABELS).map(([key, label]) => (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => handlePostactsStatusChange(key)}
                          className="flex items-center justify-between"
                        >
                          <Badge 
                            variant="secondary" 
                            className={`ml-2 ${FINANCE_STATUS_COLORS[key as FinanceStatus] || 'bg-gray-500 text-white'}`}
                          >
                            {label}
                          </Badge>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    variant="secondary"
                    size="sm"
                    className={`${FINANCE_STATUS_COLORS[postactsStatus as FinanceStatus] || 'bg-gray-500 text-white'} cursor-default pointer-events-none`}
                    onClick={(e) => e.preventDefault()}
                  >
                    {FINANCE_STATUS_LABELS[postactsStatus as FinanceStatus] || postactsStatus}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6">
          <div className="flex gap-2">
            {files.length > 0 ? (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://drive.google.com/drive/folders/${files[0].parentFolderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Finance Activity Drive
                </a>
              </Button>
            ) : null}
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Upload Receipts
            </Button>
          </div>
        </div>
      </div>

      {/* Finance Files Section */}
      <div className="rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">Finance Files</span>
        </div>
        {isLoadingFiles ? (
          <div className="space-y-4">
            <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
            <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
            <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
          </div>
        ) : files.length > 0 ? (
          renderFileList()
        ) : (
          <div className="space-y-6">
            {stepperSteps ? (
              <div className="space-y-6">
                {stepperSteps.map((step, idx) => {
                  const isCurrent = step.status === "pending" && !stepperSteps.slice(0, idx).some((s: any) => s.status === "pending");
                  const isDone = step.status === "success";
                  const isError = step.status === "error";
                  const isFinal = step.label.includes("Complete!");
                  
                  return (
                    <div key={idx} className={`flex items-center gap-3 text-sm ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                      {isDone && <CircleCheck className="w-4 h-4 text-white" />}
                      {isCurrent && !isDone && !isError && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      {isError && <Circle className="w-4 h-4 text-red-500" />}
                      {!isDone && !isCurrent && !isError && <Circle className="w-4 h-4" />}
                      {isFinal && files.length > 0 && isDone ? (
                        <a
                          href={`https://drive.google.com/drive/folders/${files[0].parentFolderId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium"
                        >
                          {step.label}
                        </a>
                      ) : (
                        <span className={isCurrent ? "font-semibold" : ""}>{step.label}</span>
                      )}
                      {isError && <span className="ml-2 text-red-500">{step.message}</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <FinanceTemplateSelect
                  value={selectedTemplates}
                  onChange={setSelectedTemplates}
                  disabled={isGenerating}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-6"
                  onClick={handleGenerateFolder}
                  disabled={!selectedTemplates.length || isGenerating}
                >
                  {isGenerating ? (
                    "Generating..."
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.433 22l-1.98-9.708 6.565-6.565 1.98 9.708-6.565 6.565zm2.828-2.828l4.95-4.95-1.414-1.414-4.95 4.95 1.414 1.414zm9.9-9.9l4.95-4.95-1.414-1.414-4.95 4.95 1.414 1.414zm2.828-2.828l1.414-1.414-4.95-4.95-1.414 1.414 4.95 4.95z"/>
                      </svg>
                      Generate Finance Folder
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}