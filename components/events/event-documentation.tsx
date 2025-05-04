"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stepper } from "@/components/ui/stepper";
import { Separator } from "@/components/ui/separator";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy } from "lucide-react";
import { Event } from "@/app/types";

interface EventDocumentationProps {
  event: Event;
}

export function EventDocumentation({ }: EventDocumentationProps) {
  const [slug, setSlug] = useState("");
  const [generatedLinks, setGeneratedLinks] = useState<{
    gals: string;
    prereg: string;
  } | null>(null);
  const [preActsFiles, setPreActsFiles] = useState<string[]>([]);
  const [postActsFiles, setPostActsFiles] = useState<string[]>([]);

  const preActsOptions = [
    { label: "Project Proposal", value: "project-proposal" },
    { label: "Logistics Request", value: "logistics-request" },
    { label: "Budget Proposal", value: "budget-proposal" },
    { label: "Risk Assessment", value: "risk-assessment" },
    { label: "Marketing Plan", value: "marketing-plan" },
    { label: "Timeline", value: "timeline" },
  ];

  const postActsOptions = [
    { label: "Event Report", value: "event-report" },
    { label: "Financial Report", value: "financial-report" },
    { label: "Attendance Report", value: "attendance-report" },
    { label: "Feedback Summary", value: "feedback-summary" },
    { label: "Photos and Media", value: "photos-media" },
    { label: "Certificate Templates", value: "certificate-templates" },
  ];

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

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Initialize Files</h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Pre-Acts Documents</Label>
            <Combobox
              options={preActsOptions}
              value={preActsFiles}
              onChange={setPreActsFiles}
              placeholder="Select Pre-Acts documents..."
            />
          </div>
          <div className="space-y-2">
            <Label>Post-Acts Documents</Label>
            <Combobox
              options={postActsOptions}
              value={postActsFiles}
              onChange={setPostActsFiles}
              placeholder="Select Post-Acts documents..."
            />
          </div>
        </div>
      </div>

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