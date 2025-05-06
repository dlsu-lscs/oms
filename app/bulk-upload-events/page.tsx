"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/event-form/use-toast";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import CompactEventList from "@/components/CompactEventList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface Member {
  id: number;
  full_name: string;
  email: string;
}

interface Committee {
  id: number;
  name: string;
  description: string;
}

interface Event {
  'Activity Title': string;
  Duration: string;
  'Target Activity Date': string[];
  'Activity Nature': string;
  'Activity Type': string;
  'Budget Allocation': string;
  Venue: string;
  'Brief Description': string;
  Goals: string;
  Objectives: string;
  Strategies: string;
  Measures: string;
  'Project Head': string[];
  [key: string]: string | string[];
}

export default function BulkUploadEventsPage() {
  const [sheetUrl, setSheetUrl] = React.useState("");
  const [sheetNames, setSheetNames] = React.useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [spreadsheetTitle, setSpreadsheetTitle] = React.useState("");
  const [parsedData, setParsedData] = React.useState<Event[]>([]);
  const [viewMode, setViewMode] = React.useState<"table" | "compact">("compact");
  const [members, setMembers] = useState<Member[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      if (sheetNames.length === 0) {
        // First step: fetch sheet/tab names
        const response = await fetch("/api/bulk-upload-events/sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetUrl }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch sheets");
        }
        setSheetNames(result.sheetNames);
        setSpreadsheetTitle(result.spreadsheetTitle);
        setSelectedSheet(result.sheetNames[0] || "");
        toast({ title: "Sheets Loaded", description: `Found ${result.sheetNames.length} sheets.` });
      } else {
        // Second step: parse and upload selected sheet
        const response = await fetch("/api/bulk-upload-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetUrl, sheetName: selectedSheet }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to upload events");
        }
        const dataWithArrays = result.data.map((event: Event) => ({
          ...event,
          'Project Head': Array.isArray(event['Project Head']) ? event['Project Head'] : event['Project Head'] ? [event['Project Head']] : []
        }));
        setParsedData(dataWithArrays || []);
        toast({ title: "Success", description: `Imported ${result.data.length} rows.` });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage((error as Error).message);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!sheetUrl || !selectedSheet) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/bulk-upload-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl, sheetName: selectedSheet }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to refresh data");
      }
      setParsedData(result.data || []);
      toast({ title: "Success", description: "Data refreshed successfully." });
    } catch (error) {
      console.error("Refresh error:", error);
      setErrorMessage((error as Error).message);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Extract spreadsheet name from URL
  const getSpreadsheetName = (url: string) => {
    try {
      const urlObj = new URL(url);
      // Extract the spreadsheet ID from the URL
      const spreadsheetId = urlObj.pathname.split('/')[3];
      // If we have a spreadsheet ID, use it as the name
      if (spreadsheetId) {
        return `Spreadsheet (${spreadsheetId})`;
      }
      return 'Untitled Spreadsheet';
    } catch {
      return 'Untitled Spreadsheet';
    }
  };

  const columns = [
    'Activity Title','Duration','Brief Description','Goals',
    'Objectives','Strategies','Measures','Target Activity Date',
    'Activity Nature','Activity Type','Budget Allocation','Venue'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersRes, committeesRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/committees')
        ]);

        if (!membersRes.ok || !committeesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [membersData, committeesData] = await Promise.all([
          membersRes.json(),
          committeesRes.json()
        ]);

        setMembers(membersData);
        setCommittees(committeesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('Failed to load members and committees');
      }
    };

    fetchData();
  }, []);

  const handleProjectHeadChange = (eventIndex: number, memberId: number) => {
    console.log('handleProjectHeadChange called:', { eventIndex, memberId });
    setParsedData(prev => {
      console.log('Previous state:', prev[eventIndex]);
      const newData = prev.map((event, index) => {
        if (index === eventIndex) {
          const currentHeads = Array.isArray(event['Project Head']) ? event['Project Head'] : [];
          console.log('Current project heads:', currentHeads);
          if (memberId === 0) {
            return { ...event, 'Project Head': [] };
          }
          const newHeads = currentHeads.includes(memberId.toString()) 
            ? currentHeads.filter(id => id !== memberId.toString())
            : [...currentHeads, memberId.toString()];
          console.log('New project heads:', newHeads);
          return { ...event, 'Project Head': newHeads };
        }
        return event;
      });
      console.log('New state:', newData[eventIndex]);
      return newData;
    });
  };

  const handleCommitteeChange = (eventIndex: number, committeeId: number) => {
    setParsedData(prev => prev.map((event, index) => {
      if (index === eventIndex) {
        // If committeeId is 0, it means we're removing the committee
        if (committeeId === 0) {
          return { ...event, 'Committee': [] };
        }
        // Otherwise, set the new committee
        return { ...event, 'Committee': [committeeId.toString()] };
      }
      return event;
    }));
  };

  const handleDateChange = (eventIndex: number, dates: string[]) => {
    setParsedData(prev => prev.map((event, index) => {
      if (index === eventIndex) {
        return { ...event, 'Target Activity Date': dates };
      }
      return event;
    }));
  };

  const handleDateRemove = (eventIndex: number, dateIdx: number) => {
    setParsedData(prev => prev.map((event, index) => {
      if (index === eventIndex) {
        const dates = Array.isArray(event['Target Activity Date']) ? event['Target Activity Date'] : [];
        return { ...event, 'Target Activity Date': dates.filter((_, i) => i !== dateIdx) };
      }
      return event;
    }));
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 px-4 md:gap-6 md:py-6 md:px-6">
              <Card className="max-w-2xl mx-auto w-full">
                <CardHeader>
                  <CardTitle>Upload GOSM</CardTitle>
                  {!sheetNames.length && (
                    <CardDescription className="space-y-2">
                      <p>Paste your Google Sheet link below to import events in bulk. Make sure your sheet follows the required format.</p>
                      <p className="font-medium">Required Fields:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Activity Title</li>
                          <li>Duration</li>
                          <li>Brief Description</li>
                          <li>Goals</li>
                        </ul>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Objectives</li>
                          <li>Strategies</li>
                          <li>Measures</li>
                          <li>Target Activity Date</li>
                        </ul>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Activity Nature</li>
                          <li>Activity Type</li>
                          <li>Budget Allocation</li>
                          <li>Venue</li>
                        </ul>
                      </div>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {errorMessage && (
                    <p className="text-sm text-destructive mb-2">
                      {errorMessage}
                    </p>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sheet-url">Google Sheet URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="sheet-url"
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          value={sheetUrl}
                          onChange={(e) => setSheetUrl(e.target.value)}
                          className="w-full"
                          disabled={sheetNames.length > 0}
                        />
                        {sheetNames.length > 0 && (
                          <Select
                            value={selectedSheet}
                            onValueChange={setSelectedSheet}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Choose sheet" />
                            </SelectTrigger>
                            <SelectContent>
                              {sheetNames.map((name) => (
                                <SelectItem key={name} value={name}>
                                  {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      {sheetNames.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          The sheet should contain all the required fields listed above. Make sure the column headers match exactly.
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={isLoading || !sheetUrl || (sheetNames.length > 0 && !selectedSheet)}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          {sheetNames.length === 0 ? "Loading Sheets..." : "Fetching Events..."}
                        </>
                      ) : sheetNames.length === 0 ? (
                        "Load Sheets"
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {parsedData.length > 0 ? "Refresh Events" : "Upload Events"}
                        </>
                      )}
                    </Button>
                  </form>
                  {parsedData.length > 0 && (
                    <div className="mt-6">
                      <Tabs defaultValue="compact" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="compact">Compact View</TabsTrigger>
                          <TabsTrigger value="table">Table View</TabsTrigger>
                        </TabsList>
                        <TabsContent value="compact" className="mt-4">
                          <CompactEventList 
                            events={parsedData} 
                            members={members}
                            committees={committees}
                            onProjectHeadChange={handleProjectHeadChange}
                            onCommitteeChange={handleCommitteeChange}
                            onDateChange={handleDateChange}
                            onDateRemove={handleDateRemove}
                          />
                        </TabsContent>
                        <TabsContent value="table" className="mt-4">
                          <div className="overflow-auto">
                            <table className="w-full divide-y divide-border whitespace-normal break-words">
                              <thead className="bg-muted/50">
                                <tr>
                                  {columns.map((col) => (
                                    <th
                                      key={col}
                                      className="px-2 py-1 text-left text-xs font-medium text-muted-foreground border-r border-border last:border-r-0"
                                    >
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border bg-background">
                                {parsedData.map((row, rowIndex) => (
                                  <tr key={rowIndex} className="hover:bg-muted/50">
                                    {columns.map((col) => (
                                      <td
                                        key={col}
                                        className="px-2 py-1 text-xs text-foreground border-r border-border last:border-r-0"
                                      >
                                        {row[col] || '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 