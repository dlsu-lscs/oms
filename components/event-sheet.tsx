"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Stepper } from "@/components/ui/stepper";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  Clock,
  Users,
  Edit,
  ExternalLink,
  Link2,
  X,
  Copy,
} from "lucide-react";
import { Event, Participant } from "@/app/types";
import { Combobox } from "@/components/ui/combobox";
import { create } from "zustand";

// Type definitions needed for the component

interface EventSidebarProps {
  event: Event | null;
  participants: Participant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EventSheetStore {
  isOpen: boolean;
  currentEvent: Event | null;
  openEventSheet: (event: Event) => void;
  closeEventSheet: () => void;
}

export const useEventSheet = create<EventSheetStore>((set: any) => ({
  isOpen: false,
  currentEvent: null,
  openEventSheet: (event: Event) => set({ isOpen: true, currentEvent: event }),
  closeEventSheet: () => set({ isOpen: false, currentEvent: null }),
}));

export function EventSidebar({
  event,
  participants,
  open,
  onOpenChange,
}: EventSidebarProps) {
  const [activeTab, setActiveTab] = useState("overview");
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

  if (!event) return null;

  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);

  const formattedStartDate = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedStartTime = startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedEndTime = endDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto p-0"
      >
        <div className="h-full flex flex-col">
          <SheetHeader className="p-6 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-2xl font-bold">
                    {event.name}
                  </SheetTitle>
                  <Badge variant="outline">{event.arn}</Badge>
                </div>
                <p className="text-muted-foreground">{event.committee}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/events/${event.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Link href={`/events/${event.id}`} target="_blank">
                  <Button size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </Link>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 p-6 overflow-y-auto">
            <Tabs
              defaultValue="overview"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="documentation">Documentation</TabsTrigger>
                <TabsTrigger value="preregistrations">
                  Preregistrations
                </TabsTrigger>
                <TabsTrigger value="participants">
                  Attendance <Badge className="text-xs py-0">5</Badge>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-6">
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <Image
                    src={event.eventVisual || "/placeholder.svg"}
                    alt={event.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">
                        Date & Time
                      </h3>
                      <div className="flex items-start gap-2">
                        <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p>{formattedStartDate}</p>
                          <p className="text-sm text-muted-foreground">
                            {formattedStartTime} - {formattedEndTime}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">
                        Duration
                      </h3>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p>{event.duration}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">
                        Type & Nature
                      </h3>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{event.type}</Badge>
                        <Badge variant="outline">{event.nature}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">
                        Participants
                      </h3>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <p>{participants.length} registered</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">
                        Forms
                      </h3>
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
                                <Button onClick={handleGenerateLinks}>
                                  Generate
                                </Button>
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

                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">
                        Custom Links
                      </h3>
                      <div className="space-y-2">
                        {event.customLinks.map((link, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Link
                              href={link.url}
                              target="_blank"
                              className="text-primary hover:underline flex items-center"
                            >
                              <Link2 className="h-3 w-3 mr-1" />
                              {link.title}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-2" />

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">
                    Event Post Caption
                  </h3>
                  <p>{event.eventPostCaption}</p>
                </div>
              </TabsContent>

              <TabsContent value="participants">
                <div className="rounded-md border border-border/40">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Name</th>
                        <th className="p-3 text-left font-medium">Email</th>
                        <th className="p-3 text-left font-medium">
                          Registered
                        </th>
                        <th className="p-3 text-left font-medium">Attended</th>
                        <th className="p-3 text-left font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant) => {
                        const registeredDate = new Date(
                          participant.registeredAt,
                        );
                        const formattedRegisteredDate =
                          registeredDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });

                        return (
                          <tr key={participant.id} className="border-b">
                            <td className="p-3">{participant.name}</td>
                            <td className="p-3">{participant.email}</td>
                            <td className="p-3">{formattedRegisteredDate}</td>
                            <td className="p-3">
                              {participant.attended ? (
                                <Badge variant="default">Yes</Badge>
                              ) : (
                                <Badge variant="secondary">No</Badge>
                              )}
                            </td>
                            <td className="p-3">
                              <Button variant="ghost" size="sm">
                                Add Note
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="preregistrations">
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <p className="text-muted-foreground">
                      Preregistration data will appear here once available
                    </p>
                    <Button className="mt-4" variant="outline">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Preregistration Form
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documentation">
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
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
