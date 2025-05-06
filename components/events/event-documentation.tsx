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
import { Copy, CheckCircle, Loader2, Circle, CircleCheck } from "lucide-react";
import { Event } from "@/app/types";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiselectDropdown } from "@/components/ui/MultiselectDropdown";
import { PreActsTemplatesSkeleton } from "@/components/events/PreActsTemplatesSkeleton";
import { Badge } from "@/components/ui/badge";

interface EventDocumentationProps {
  event: Event;
}

export function EventDocumentation({ event }: EventDocumentationProps) {
  const [slug, setSlug] = useState("");
  const [generatedLinks, setGeneratedLinks] = useState<{
    gals: string;
    prereg: string;
  } | null>(null);
  const [preActsTemplates, setPreActsTemplates] = useState<{ label: string; value: string; url: string }[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepperSteps, setStepperSteps] = useState<any[] | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const DRIVE_FOLDER_ID = "1wk2ZMP3KhuIp1O4KFpi324_3LTaIiRFQ";

  useEffect(() => {
    async function fetchFiles() {
      try {
        setIsLoadingFiles(true);
        const res = await fetch("/api/drive-folder-files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: DRIVE_FOLDER_ID }),
        });
        const data = await res.json();
        if (res.ok && data.files) {
          setPreActsTemplates(
            data.files.map((f: any) => ({ label: f.name, value: f.id, url: f.url }))
          );
        }
      } catch (err) {
        // Optionally handle error
      } finally {
        setIsLoadingFiles(false);
      }
    }
    fetchFiles();
  }, []);

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

  const handleCheckboxChange = (label: string) => {
    setSelectedTemplates((prev) => {
      if (prev.includes(label)) {
        return prev.filter((l) => l !== label);
      } else {
        return [...prev, label];
      }
    });
  };

  const handleGenerateFolder = async () => {
    const templateUrls = preActsTemplates
      .filter((t) => selectedTemplates.includes(t.value))
      .map((t) => t.url);
    if (!event?.event_name || templateUrls.length === 0) {
      alert("Please select at least one template.");
      return;
    }
    setIsGenerating(true);
    setStepperSteps([
      { label: "Create new folder", status: "pending", message: "" },
      ...templateUrls.map((url) => ({ label: `Create file: ${url}`, status: "pending", message: "" })),
      { label: "Complete! Click here to access drive.", status: "pending", message: "" }
    ]);
    try {
      const res = await fetch("/api/generate-activity-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventName: event.event_name, templateUrls }),
      });
      const data = await res.json();
      if (res.ok && data.steps) {
        setFolderId(data.folderId);
        // Animate stepper: update one step at a time
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
      } else {
        alert(`Error: ${data.error}`);
        setStepperSteps(null);
      }
    } catch (err: any) {
      alert("An unexpected error occurred.");
      setStepperSteps(null);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {isLoadingFiles ? (
        <PreActsTemplatesSkeleton />
      ) : (
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Pre-Acts File Templates</h3>
          {stepperSteps ? (
            <div className="space-y-6">
              {stepperSteps.map((step, idx) => {
                const isCurrent = step.status === "pending" && !stepperSteps.slice(0, idx).some((s: any) => s.status === "pending");
                const isDone = step.status === "success";
                const isError = step.status === "error";
                const isFinal = step.label.includes("Complete!");
                // If step is a file creation, show badge with file name
                let fileBadge = null;
                if (step.label.startsWith("Create file:")) {
                  const fileUrl = step.label.replace("Create file: ", "").trim();
                  const file = preActsTemplates.find(f => f.url === fileUrl || f.value === fileUrl || fileUrl.includes(f.value));
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
                <MultiselectDropdown
                  options={preActsTemplates}
                  value={selectedTemplates}
                  onChange={setSelectedTemplates}
                  placeholder="Select Pre-Acts documents..."
                />
              </div>
              <Button variant="outline" size="sm" className="mt-6" onClick={handleGenerateFolder} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate Activity Folder"}
              </Button>
            </>
          )}
        </div>
      )}

      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Documentation Status</h3>
        <Stepper
          steps={[
            {
              title: "Pre-Acts",
              description: "Initial project documentation and planning",
              status: "complete",
              date: "2024-03-15",
              actionButton: {
                label: "Open Pre-Acts Drive",
                onClick: () => window.open("https://drive.google.com/drive/folders/pre-acts", "_blank")
              }
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
              date: "2024-04-02",
              actionButton: {
                label: "Open Post-Acts Drive",
                onClick: () => window.open("https://drive.google.com/drive/folders/post-acts", "_blank")
              }
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
      
      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Required Documents</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Project Proposal</h4>
              <p className="text-sm text-muted-foreground">Initial project documentation</p>
            </div>
            <Button variant="outline" size="sm">
              View Document
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">CSO Submission</h4>
              <p className="text-sm text-muted-foreground">CSO review documentation</p>
            </div>
            <Button variant="outline" size="sm">
              View Document
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Event Report</h4>
              <p className="text-sm text-muted-foreground">Post-event documentation</p>
            </div>
            <Button variant="outline" size="sm">
              View Document
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Form Links</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Generate Links
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Form Links</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Enter Slug</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    placeholder="Enter slug (e.g., event-name)"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                  <Button onClick={handleGenerateLinks}>Generate</Button>
                </div>
              </div>

              {/* Live Preview Section */}
              <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
                <h4 className="text-sm font-medium">Preview</h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">GALS Link</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">lscs.info/<span className="font-medium text-foreground">{slug || "your-slug"}</span>GALS</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Preregistration Link</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">lscs.info/</span>
                      <span className="font-medium">{slug || "your-slug"}PreReg</span>
                    </div>
                  </div>
                </div>
              </div>

              {generatedLinks && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>GALS Link</Label>
                    <div className="flex gap-2">
                      <Input
                        value={generatedLinks.gals}
                        readOnly
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(generatedLinks.gals)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Preregistration Link</Label>
                    <div className="flex gap-2">
                      <Input
                        value={generatedLinks.prereg}
                        readOnly
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(generatedLinks.prereg)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 