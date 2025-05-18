"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stepper } from "@/components/ui/stepper";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Copy, CheckCircle, Loader2, Circle, CircleCheck, AlertCircle, FileText, ExternalLink, Calendar, Pencil, UserRoundPen, FilePen, FileClock, FileCog, FileWarning, FilePenLine, FileCheck } from "lucide-react";
import { Event, FileStatus, fileStatuses, DocumentationStatus, documentationStatuses, documentationStatusLabels } from "@/app/types";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiselectDropdown } from "@/components/ui/MultiselectDropdown";
import { PreActsTemplatesSkeleton } from "@/components/events/PreActsTemplatesSkeleton";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { toast } from "sonner";
import { FileStatusBadge } from "@/components/ui/file-status-badge";
import { formatDistanceToNow, format } from 'date-fns';
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface EventDocumentationProps {
  event: Event;
}

interface DriveFile {
  id: string;
  name: string;
  url: string;
  type: string;
  createdTime: string;
  modifiedTime: string;
  lastModifiedBy: string;
  status?: string;
}

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

// Update the stepperStatusConfig
const stepperStatusConfig: Record<DocumentationStatus, {
  icon: LucideIcon;
  message: string;
  color: string;
  circleClassName: string;
}> = {
  // Initial states
  INIT: {
    icon: Circle,
    message: "The documentation team is currently initializing the documents.",
    color: "text-muted-primary",
    circleClassName: "border-primary bg-grey text-muted-primary"
  },
  AVP: {
    icon: FilePen,
    message: "The project heads can now draft the documents.",
    color: "text-primary",
    circleClassName: "border-primary bg-muted-primary text-primary"
  },
  SENT: {
    icon: FileClock,
    message: "The documentation team can now review the documents.",
    color: "text-primary",
    circleClassName: "border-primary bg-muted-primary text-primary"
  },
  DOCU: {
    icon: FileCog,
    message: "The documentation team is currently reviewing the documents.",
    color: "text-primary",
    circleClassName: "border-primary bg-muted-primary text-primary"
  },
  REVISE: {
    icon: FileWarning,
    message: "The documentation team has requested revisions to the documents.",
    color: "text-primary",
    circleClassName: "border-primary bg-muted-primary text-primary"
  },
  SIGNATURES: {
    icon: FilePenLine,
    message: "The documentation team is currently collecting signatures from the event heads.",
    color: "text-primary",
    circleClassName: "border-primary bg-muted-primary text-primary"
  },
  SUBMITTED: {
    icon: FileCheck,
    message: "The documents have been submitted to CSO/SLIFE.",
    color: "text-primary",
    circleClassName: "border-primary bg-muted-primary text-primary"
  },
  // Incentive states
  FULLINCENTIVE: {
    icon: CheckCircle,
    message: "The documents have been approved and the incentive has been awarded.",
    color: "text-green-500",
    circleClassName: "border-green-500 bg-green-500 text-white"
  },
  HALFINCENTIVE: {
    icon: CheckCircle,
    message: "Half Incentive",
    color: "text-green-500",
    circleClassName: "border-green-500 bg-green-500 text-white"
  },
  // Approval states
  EARLYAPPROVAL: {
    icon: CheckCircle,
    message: "Early Approved",
    color: "text-green-500",
    circleClassName: "border-green-500 bg-green-500 text-white"
  },
  LATEAPPROVAL: {
    icon: CheckCircle,
    message: "Late Approved",
    color: "text-green-500",
    circleClassName: "border-green-500 bg-green-500 text-white"
  },
  // Completion states
  EARLYCOMP: {
    icon: CircleCheck,
    message: "Early Complete",
    color: "text-green-500",
    circleClassName: "border-green-500 bg-green-500 text-white"
  },
  EARLYINC: {
    icon: AlertCircle,
    message: "Early Incomplete",
    color: "text-orange-500",
    circleClassName: "border-orange-500 bg-orange-500 text-white"
  },
  LATECOMP: {
    icon: CheckCircle,
    message: "Late Complete",
    color: "text-green-500",
    circleClassName: "border-green-500 bg-green-500 text-white"
  },
  LATEINC: {
    icon: AlertCircle,
    message: "Late Incomplete",
    color: "text-orange-500",
    circleClassName: "border-orange-500 bg-orange-500 text-white"
  },
  // Special states
  SPECIAL: {
    icon: Circle,
    message: "Special",
    color: "text-gray-400",
    circleClassName: "border-gray-300 bg-white text-gray-400"
  },
  DEFAULT: {
    icon: Circle,
    message: "Default",
    color: "text-gray-400",
    circleClassName: "border-gray-300 bg-white text-gray-400"
  },
  PENDED: {
    icon: Circle,
    message: "Pending",
    color: "text-gray-400",
    circleClassName: "border-gray-300 bg-white text-gray-400"
  },
  UNCPEND: {
    icon: Circle,
    message: "Uncounted Pend",
    color: "text-gray-400",
    circleClassName: "border-gray-300 bg-white text-gray-400"
  },
  // Negative states
  DENIED: {
    icon: AlertCircle,
    message: "Denied",
    color: "text-red-500",
    circleClassName: "border-red-500 bg-red-500 text-white"
  },
  HOLD: {
    icon: AlertCircle,
    message: "On Hold",
    color: "text-orange-500",
    circleClassName: "border-orange-500 bg-orange-500 text-white"
  },
  CANCELLED: {
    icon: AlertCircle,
    message: "Cancelled",
    color: "text-red-500",
    circleClassName: "border-red-500 bg-red-500 text-white"
  }
} as const;

const validateStatus = (status: string | null): FileStatus => {
  if (fileStatuses.includes(status as FileStatus)) {
    return status as FileStatus;
  }
  throw new Error(`Invalid status: ${status}`);
};

const fetchWithRetry = async (url: string, options: any, retries = 3): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Failed to fetch after retries');
};

async function getPostactsFiles(eventId: number) {
  const response = await fetch('/api/events/postacts-files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId }),
  });
  
  if (!response.ok) throw new Error('Failed to fetch Post-Acts files');
  const data = await response.json();

  // Fetch all file statuses in bulk
  let fileStatuses = {};
  if (data.files.length > 0) {
    const fileKeys = data.files.map((file: DriveFile) => file.id).join(',');
    const statusResponse = await fetch(`/api/events/file-status?fileKeys=${fileKeys}`);
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('File statuses response:', statusData); // Debug log
      fileStatuses = statusData.statuses;
    }
  }

  return {
    files: data.files,
    fileStatuses,
    postactsDeadline: data.postactsDeadline,
    postactsStatus: data.postactsStatus || 'INIT'
  };
}

export function EventDocumentation({ event }: EventDocumentationProps) {
  const [slug, setSlug] = useState("");
  const [generatedLinks, setGeneratedLinks] = useState<{
    gals: string;
    prereg: string;
  } | null>(null);
  const [preActsTemplates, setPreActsTemplates] = useState<{ label: string; value: string; url: string }[]>([]);
  const [postActsTemplates, setPostActsTemplates] = useState<{ label: string; value: string; url: string }[]>([]);
  const [selectedPreActsTemplates, setSelectedPreActsTemplates] = useState<string[]>([]);
  const [selectedPostActsTemplates, setSelectedPostActsTemplates] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepperSteps, setStepperSteps] = useState<any[] | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preactsStatus, setPreactsStatus] = useState<string>('INIT');
  const [postactsStatus, setPostactsStatus] = useState<string>('INIT');
  const [preactsFiles, setPreactsFiles] = useState<DriveFile[]>([]);
  const [postactsFiles, setPostactsFiles] = useState<DriveFile[]>([]);
  const [isLoadingPreactsFiles, setIsLoadingPreactsFiles] = useState(false);
  const [isLoadingPostactsFiles, setIsLoadingPostactsFiles] = useState(false);
  const [preactsDeadline, setPreactsDeadline] = useState<string | null>(null);
  const [postactsDeadline, setPostactsDeadline] = useState<string | null>(null);
  const [defaultOpenFile, setDefaultOpenFile] = useState<string | null>(null);
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatus>>({});
  const [dateRange, setDateRange] = useState<{ start_time: Date; end_time: Date } | null>(null);
  const { data: session } = useSession();
  const isDoculogi = session?.user?.committeeId?.toString() === 'DOCULOGI';

  // Add loading states
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<string, string | null>>({});

  useEffect(() => {
    async function fetchDateRange() {
      if (!event?.id) return;

      try {
        const response = await fetch('/api/events/date-range', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ eventId: event.id }),
        });

        if (!response.ok) throw new Error('Failed to fetch event date range');
        const data = await response.json();
        setDateRange(data);
      } catch (error) {
        console.error('Error fetching event date range:', error);
      }
    }

    fetchDateRange();
  }, [event?.id]);

  // Add debug logging
  useEffect(() => {
    console.log('EventDocumentation - Event Data:', {
      event,
      preactsStatus,
      postactsStatus,
      isDoculogi
    });
  }, [event, preactsStatus, postactsStatus, isDoculogi]);

  // Helper for months
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    async function fetchFiles() {
      try {
        setIsLoadingFiles(true);
        setError(null);

        // Fetch Pre-Acts templates
        const preActsRes = await fetch("/api/drive-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "pre-acts" }),
        });
        const preActsData = await preActsRes.json();
        if (preActsRes.ok && preActsData.files) {
          setPreActsTemplates(
            preActsData.files.map((f: any) => ({ label: f.name, value: f.id, url: f.url }))
          );
        }

        // Fetch Post-Acts templates
        const postActsRes = await fetch("/api/drive-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "post-acts" }),
        });
        const postActsData = await postActsRes.json();
        if (postActsRes.ok && postActsData.files) {
          setPostActsTemplates(
            postActsData.files.map((f: any) => ({ label: f.name, value: f.id, url: f.url }))
          );
        }
      } catch (err) {
        setError("Failed to load templates");
      } finally {
        setIsLoadingFiles(false);
      }
    }
    fetchFiles();
  }, []);

  useEffect(() => {
    async function fetchPreactsStatus() {
      if (!event?.id) return;
      
      try {
        const response = await fetch(`/api/events/preacts-status?eventId=${event.id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) throw new Error('Failed to fetch preacts status');
        const data = await response.json();
        setPreactsStatus(data.status || 'INIT');
      } catch (error) {
        console.error('Error fetching preacts status:', error);
        setPreactsStatus('INIT');
      }
    }

    fetchPreactsStatus();
  }, [event?.id]);

  useEffect(() => {
    async function fetchPreactsFiles() {
      if (!event?.id) return;
      
      console.log('Fetching preacts files with status:', preactsStatus);
      setIsLoadingPreactsFiles(true);
      try {
        const response = await fetch('/api/events/preacts-files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: event.id }),
        });
        
        if (!response.ok) throw new Error('Failed to fetch Pre-Acts files');
        const data = await response.json();
        console.log('Received files:', data.files);
        setPreactsFiles(data.files);
        setPreactsDeadline(data.preactsDeadline);
        setPreactsStatus(data.preactsStatus || 'INIT');

        // Fetch all file statuses in bulk
        if (data.files.length > 0) {
          const fileKeys = data.files.map((file: DriveFile) => file.id).join(',');
          const statusResponse = await fetch(`/api/events/file-status?fileKeys=${fileKeys}`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setFileStatuses(statusData.statuses);
          }
        }

        // Treat null deadline as date zero (1970-01-01)
        const deadline = data.preactsDeadline ? new Date(data.preactsDeadline) : new Date(0);
        if (deadline > new Date() && data.files.length > 0) {
          setDefaultOpenFile(data.files[0].id);
        }
      } catch (error) {
        console.error('Error fetching Pre-Acts files:', error);
        toast.error('Failed to load Pre-Acts files');
      } finally {
        setIsLoadingPreactsFiles(false);
      }
    }

    fetchPreactsFiles();
  }, [event?.id, preactsStatus]);

  useEffect(() => {
    async function fetchPostactsFiles() {
      if (!event?.id) return;
      
      setIsLoadingPostactsFiles(true);
      try {
        const data = await getPostactsFiles(event.id);
        console.log('Postacts files data:', data); // Debug log
        setPostactsFiles(data.files);
        
        // Map file statuses using file_key
        const newStatuses: Record<string, FileStatus> = {};
        if (data.files.length > 0) {
          const fileKeys = data.files.map((file: DriveFile) => file.id).join(',');
          const statusResponse = await fetch(`/api/events/file-status?fileKeys=${fileKeys}`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('File statuses response:', statusData); // Debug log
            Object.entries(statusData.statuses).forEach(([key, value]) => {
              newStatuses[key] = value as FileStatus;
            });
          }
        }
        
        setFileStatuses(prev => ({
          ...prev,
          ...newStatuses
        }));
        setPostactsDeadline(data.postactsDeadline);
        setPostactsStatus(data.postactsStatus);

        if (dateRange?.end_time) {
          const eventEndDate = new Date(dateRange.end_time);
          if (eventEndDate < new Date() && data.files.length > 0) {
            setDefaultOpenFile(data.files[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching Post-Acts files:', error);
        toast.error('Failed to load Post-Acts files');
      } finally {
        setIsLoadingPostactsFiles(false);
      }
    }

    fetchPostactsFiles();
  }, [event?.id, dateRange?.end_time]);

  const handleGenerateLinks = () => {
    if (!slug) return;
    const baseUrl = "lscs.info";
    setGeneratedLinks({
      gals: `${baseUrl}/${slug}GALS`,
      prereg: `${baseUrl}/${slug}PreReg`,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleGenerateFolder = async () => {
    setIsGenerating(true);
    setError(null);
    
    // Debug logging
    console.log("Event data:", {
      id: event.id,
      name: event.event_name,
      committee: event.committee
    });

    if (!event.id || !event.event_name || !event.committee) {
      setError("Missing required event data");
      toast.error("Missing required event data");
      setIsGenerating(false);
      return;
    }

    // Get the full URLs for selected templates
    const preActsUrls = preActsTemplates
      .filter(t => selectedPreActsTemplates.includes(t.value))
      .map(t => t.url);
    
    const postActsUrls = postActsTemplates
      .filter(t => selectedPostActsTemplates.includes(t.value))
      .map(t => t.url);

    // Set initial stepper steps
    setStepperSteps([
      { label: "Finding committee folder", status: "pending", message: "" },
      { label: "Finding term folder", status: "pending", message: "" },
      { label: "Create new folder", status: "pending", message: "" },
      ...preActsUrls.map((url) => ({ label: `Create Pre-Acts file: ${url}`, status: "pending", message: "" })),
      ...postActsUrls.map((url) => ({ label: `Create Post-Acts file: ${url}`, status: "pending", message: "" })),
      { label: "Complete! Click here to access drive.", status: "pending", message: "" }
    ]);

    try {
      const response = await fetch("/api/generate-activity-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: event.event_name,
          committee: event.committee,
          preActsUrls,
          postActsUrls,
          eventId: event.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate folder");
      }

      const data = await response.json();
      console.log("Folder generated:", data);

      // Update stepper steps with the response data
      if (data.steps) {
        setFolderId(data.folderId);
        let i = 0;
        const animateSteps = async () => {
          for (; i < data.steps.length; i++) {
            setStepperSteps((prev: any) => {
              if (!prev) return null;
              const updated = prev.map((step: any, idx: number) =>
                idx === i ? data.steps[i] : step
              );
              return updated;
            });
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        };
        animateSteps();
      }

      toast.success("Activity folder generated successfully!");
    } catch (err: any) {
      console.error("Error generating folder:", err);
      setError(err.message || "Failed to generate folder");
      toast.error(err.message || "Failed to generate folder");
      setStepperSteps(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const isPreActsSelected = selectedPreActsTemplates.length > 0;
  const isPostActsSelected = selectedPostActsTemplates.length > 0;
  const canGenerate = isPreActsSelected && isPostActsSelected;

  const handlePreactsStatusChange = async (newStatus: string) => {
    if (!event?.id) return;

    try {
      const response = await fetch('/api/events/preacts-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      setPreactsStatus(newStatus);
      toast.success('Pre-Acts status updated successfully');
    } catch (error) {
      console.error('Error updating Pre-Acts status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handlePostactsStatusChange = async (newStatus: string) => {
    if (!event?.id) return;

    try {
      const response = await fetch('/api/events/postacts-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      setPostactsStatus(newStatus);
      toast.success('Post-Acts status updated successfully');
    } catch (error) {
      console.error('Error updating Post-Acts status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handleStatusChange = async (fileKey: string, newStatus: string | null) => {
    try {
      // Validate status
      const validatedStatus = validateStatus(newStatus);
      
      // Optimistic update
      setFileStatuses(prev => ({ ...prev, [fileKey]: validatedStatus }));
      setLoadingStates(prev => ({ ...prev, [fileKey]: true }));
      setErrorStates(prev => ({ ...prev, [fileKey]: null }));

      // Update on server with retry
      const response = await fetchWithRetry('/api/events/file-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey, status: validatedStatus }),
      });

      if (!response?.ok) {
        throw new Error('Failed to update file status');
      }

      // Check if all files are done
      const updatedStatuses = { ...fileStatuses, [fileKey]: validatedStatus };
      const allPreActsFilesDone = preactsFiles.every(file => updatedStatuses[file.id] === 'DONE');
      const allPostActsFilesDone = postactsFiles.every(file => updatedStatuses[file.id] === 'DONE');

      if (allPreActsFilesDone && preactsStatus !== 'SENT') {
        await handlePreactsStatusChange('SENT');
      }

      if (allPostActsFilesDone && postactsStatus !== 'SENT') {
        await handlePostactsStatusChange('SENT');
      }

      toast.success('File status updated successfully');
    } catch (error) {
      // Revert on failure
      setFileStatuses(prev => ({ ...prev, [fileKey]: prev[fileKey] }));
      setErrorStates(prev => ({ 
        ...prev, 
        [fileKey]: error instanceof Error ? error.message : 'Failed to update status' 
      }));
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setLoadingStates(prev => ({ ...prev, [fileKey]: false }));
    }
  };

  const preactsAccordion = (
    <AccordionItem value="preacts" className="border-none">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">Pre-Acts</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          <div className="flex justify-start mb-2">
            {isDoculogi ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="secondary"
                    className={`${statusColorMap[preactsStatus as keyof typeof statusColorMap] || 'bg-gray-500 text-white'} hover:opacity-90`}
                  >
                    {statusLabels[preactsStatus as keyof typeof statusLabels] || preactsStatus}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => handlePreactsStatusChange(key)}
                      className="flex items-center justify-between"
                    >
                      <Badge 
                        variant="secondary" 
                        className={`ml-2 ${statusColorMap[key as keyof typeof statusColorMap] || 'bg-gray-500 text-white'}`}
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
                className={`${statusColorMap[preactsStatus as keyof typeof statusColorMap] || 'bg-gray-500 text-white'} cursor-default pointer-events-none`}
                onClick={(e) => e.preventDefault()}
              >
                {statusLabels[preactsStatus as keyof typeof statusLabels] || preactsStatus}
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {preactsDeadline && (
              <span className="flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Deadline: {format(new Date(preactsDeadline), 'MMMM d, yyyy')}</span>
              </span>
            )}
            Track your Pre-Acts progress here. Upload and manage your Pre-Acts documents, and monitor their status.
          </p>

          {isLoadingPreactsFiles ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : preactsFiles.length > 0 ? (
            <div className="space-y-4">
              {preactsFiles.map((file) => (
                <div key={file.id} className="py-3 border-b last:border-0">
                  <div className="flex items-center justify-between mb-1">
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
                    <FileStatusBadge 
                      fileKey={file.id} 
                      initialStatus={fileStatuses[file.id] || undefined}
                      onStatusChange={(status) => handleStatusChange(file.id, status)}
                      isLoading={loadingStates[file.id]}
                      error={errorStates[file.id]}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground pl-6">
                    Last modified by {file.lastModifiedBy} {file.modifiedTime ? formatDistanceToNow(new Date(file.modifiedTime), { addSuffix: true }) : 'recently'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No files found in Pre-Acts folder</p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  const postactsAccordion = (
    <AccordionItem value="postacts" className="border-none">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">Post-Acts</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          <div className="flex justify-start mb-2">
            {isDoculogi ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="secondary"
                    className={`${statusColorMap[postactsStatus as keyof typeof statusColorMap] || 'bg-gray-500 text-white'} hover:opacity-90`}
                  >
                    {statusLabels[postactsStatus as keyof typeof statusLabels] || postactsStatus}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => handlePostactsStatusChange(key)}
                      className="flex items-center justify-between"
                    >
                      <Badge 
                        variant="secondary" 
                        className={`ml-2 ${statusColorMap[key as keyof typeof statusColorMap] || 'bg-gray-500 text-white'}`}
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
                className={`${statusColorMap[postactsStatus as keyof typeof statusColorMap] || 'bg-gray-500 text-white'} cursor-default pointer-events-none`}
                onClick={(e) => e.preventDefault()}
              >
                {statusLabels[postactsStatus as keyof typeof statusLabels] || postactsStatus}
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Track your Post-Acts progress here. Upload and manage your Post-Acts documents, and monitor their status.
            {postactsDeadline && (
              <span className="flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Deadline: {format(new Date(postactsDeadline), 'MMMM d, yyyy')}</span>
              </span>
            )}
          </p>

          {isLoadingPostactsFiles ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : postactsFiles.length > 0 ? (
            <div className="space-y-4">
              {postactsFiles.map((file) => (
                <div key={file.id} className="py-3 border-b last:border-0">
                  <div className="flex items-center justify-between mb-1">
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
                    <FileStatusBadge 
                      fileKey={file.id} 
                      initialStatus={fileStatuses[file.id] || undefined}
                      onStatusChange={(status) => handleStatusChange(file.id, status)}
                      isLoading={loadingStates[file.id]}
                      error={errorStates[file.id]}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground pl-6">
                    Last modified by {file.lastModifiedBy} {file.modifiedTime ? formatDistanceToNow(new Date(file.modifiedTime), { addSuffix: true }) : 'recently'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No files found in Post-Acts folder</p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {isLoadingFiles ? (
        <PreActsTemplatesSkeleton />
      ) : preactsStatus === 'INIT' ? (
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Create Activity Folder</h3>
          {stepperSteps ? (
            <div className="space-y-6">
              {stepperSteps.map((step, idx) => {
                const isCurrent = step.status === "pending" && !stepperSteps.slice(0, idx).some((s: any) => s.status === "pending");
                const isDone = step.status === "success";
                const isError = step.status === "error";
                const isFinal = step.label.includes("Complete!");
                let fileBadge = null;
                if (step.label.startsWith("Create file:")) {
                  const fileUrl = step.label.replace("Create file: ", "").trim();
                  const file = preActsTemplates.find(f => f.url === fileUrl || f.value === fileUrl || fileUrl.includes(f.value)) ||
                             postActsTemplates.find(f => f.url === fileUrl || f.value === fileUrl || fileUrl.includes(f.value));
                  if (file) {
                    fileBadge = (
                      <Badge className="bg-white text-black border border-border text-xs px-2 py-0.5">{file.label}</Badge>
                    );
                  }
                }
                return (
                  <div key={idx} className={`flex items-center gap-3 text-sm ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                    {isDone && <CircleCheck className="w-4 h-4 text-white" />}
                    {isCurrent && !isDone && !isError && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    {isError && <Circle className="w-4 h-4 text-red-500" />}
                    {!isDone && !isCurrent && !isError && <Circle className="w-4 h-4" />}
                    {fileBadge ? (
                      fileBadge
                    ) : isFinal && folderId && isDone ? (
                      <a
                        href={`https://drive.google.com/drive/folders/${folderId}`}
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
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Pre-Acts Documents</Label>
                  <MultiselectDropdown
                    options={preActsTemplates}
                    value={selectedPreActsTemplates}
                    onChange={setSelectedPreActsTemplates}
                    placeholder="Select Pre-Acts documents..."
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Post-Acts Documents</Label>
                  <MultiselectDropdown
                    options={postActsTemplates}
                    value={selectedPostActsTemplates}
                    onChange={setSelectedPostActsTemplates}
                    placeholder="Select Post-Acts documents..."
                  />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-6"
                onClick={handleGenerateFolder}
                disabled={!canGenerate || isGenerating}
              >
                {isGenerating ? (
                  "Generating..."
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.433 22l-1.98-9.708 6.565-6.565 1.98 9.708-6.565 6.565zm2.828-2.828l4.95-4.95-1.414-1.414-4.95 4.95 1.414 1.414zm9.9-9.9l4.95-4.95-1.414-1.414-4.95 4.95 1.414 1.414zm2.828-2.828l1.414-1.414-4.95-4.95-1.414 1.414 4.95 4.95z"/>
                    </svg>
                    Generate Activity Folder
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Documentation Status</h3>
            <Stepper
              steps={[
                {
                  title: "Pre-Acts",
                  description: stepperStatusConfig[preactsStatus as DocumentationStatus]?.message || "Initialize",
                  date: preactsDeadline ? format(new Date(preactsDeadline), 'MMM d, yyyy') : "No deadline set",
                  icon: React.createElement(stepperStatusConfig[preactsStatus as DocumentationStatus]?.icon || Circle, {
                    className: stepperStatusConfig[preactsStatus as DocumentationStatus]?.color || "text-gray-400"
                  }),
                  circleClassName: stepperStatusConfig[preactsStatus as DocumentationStatus]?.circleClassName || "border-gray-300 bg-white text-gray-400"
                },
                {
                  title: "Event Day",
                  description: "Event execution and documentation",
                  date: dateRange?.start_time ? format(new Date(dateRange.start_time), 'MMM d, yyyy') : "Not scheduled",
                  icon: React.createElement(CircleCheck, {
                    className: dateRange?.start_time && new Date(dateRange.start_time) <= new Date() ? "text-black" : "text-gray-400"
                  }),
                  circleClassName: dateRange?.start_time && new Date(dateRange.start_time) <= new Date()
                    ? "border-black bg-white text-black"
                    : "border-gray-300 bg-white text-gray-400"
                },
                {
                  title: "Post-Acts",
                  description: stepperStatusConfig[postactsStatus as DocumentationStatus]?.message || "Initialize",
                  date: postactsDeadline ? format(new Date(postactsDeadline), 'MMM d, yyyy') : "No deadline set",
                  icon: React.createElement(stepperStatusConfig[postactsStatus as DocumentationStatus]?.icon || Circle, {
                    className: stepperStatusConfig[postactsStatus as DocumentationStatus]?.color || "text-gray-400"
                  }),
                  circleClassName: stepperStatusConfig[postactsStatus as DocumentationStatus]?.circleClassName || "border-gray-300 bg-white text-gray-400"
                }
              ]}
            />
          </div>

          <Accordion 
            type="single" 
            collapsible 
            className="w-full"
            defaultValue={defaultOpenFile || undefined}
          >
            {preactsAccordion}
          </Accordion>

          <Accordion 
            type="single" 
            collapsible 
            className="w-full"
            defaultValue={defaultOpenFile || undefined}
          >
            {postactsAccordion}
          </Accordion>
        </>
      )}
    </div>
  );
} 