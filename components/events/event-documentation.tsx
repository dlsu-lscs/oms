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
import { Copy, CheckCircle, Loader2, Circle, CircleCheck, AlertCircle, FileText, ExternalLink } from "lucide-react";
import { Event } from "@/app/types";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiselectDropdown } from "@/components/ui/MultiselectDropdown";
import { PreActsTemplatesSkeleton } from "@/components/events/PreActsTemplatesSkeleton";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { toast } from "sonner";
import { FileStatusBadge } from "@/components/ui/file-status-badge";
import { formatDistanceToNow } from 'date-fns';

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
  const [preactsFiles, setPreactsFiles] = useState<DriveFile[]>([]);
  const [isLoadingPreactsFiles, setIsLoadingPreactsFiles] = useState(false);
  const [preactsDeadline, setPreactsDeadline] = useState<string | null>(null);
  const [defaultOpenFile, setDefaultOpenFile] = useState<string | null>(null);
  const [fileStatuses, setFileStatuses] = useState<Record<string, string>>({});

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
        const response = await fetch('/api/events/preacts-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: event.id }),
        });
        
        if (!response.ok) throw new Error('Failed to fetch preacts status');
        const data = await response.json();
        setPreactsStatus(data.status);
      } catch (error) {
        console.error('Error fetching preacts status:', error);
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

  const handleStatusChange = (fileKey: string, newStatus: string) => {
    setFileStatuses(prev => ({
      ...prev,
      [fileKey]: newStatus
    }));
  };

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
                  description: "Initial project documentation and planning",
                  status: "complete",
                  date: "2024-03-15",
                },
                {
                  title: "Event Day",
                  description: "Event execution and documentation",
                  status: "current",
                  date: "2024-04-01"
                },
                {
                  title: "Post-Acts",
                  description: "Post-event documentation and reports",
                  status: "upcoming",
                  date: "2024-04-02"
                },
                {
                  title: "CSO Evaluation",
                  description: "Final evaluation and feedback",
                  status: "upcoming",
                  date: "2024-04-15"
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
            <AccordionItem value="preacts-files">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <h3 className="text-lg font-semibold">Pre-Acts</h3>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
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
                            initialStatus={fileStatuses[file.id] as any}
                            onStatusChange={(status) => handleStatusChange(file.id, status)}
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
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}
    </div>
  );
} 