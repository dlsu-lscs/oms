import React from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Check, ChevronsUpDown, X, Plus, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { AlertTriangle } from 'lucide-react';

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
  'ARN': string;
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
  'Committee': string;
}

interface CompactEventListProps {
  events: Event[];
  members: Member[];
  committees: Committee[];
  onProjectHeadChange: (eventIndex: number, memberId: number) => void;
  onCommitteeChange: (eventIndex: number, committeeId: number) => void;
  onDateChange: (eventIndex: number, dates: string[]) => void;
  onDateRemove: (eventIndex: number, dateIdx: number) => void;
  onUpload?: () => void;
  onARNChange?: (eventIndex: number, arn: string) => void;
  existingArns?: string[];
  validNatures?: string[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

const CompactEventList: React.FC<CompactEventListProps> = ({ 
  events, 
  members, 
  committees,
  onProjectHeadChange,
  onCommitteeChange,
  onDateChange,
  onDateRemove,
  onUpload,
  onARNChange,
  existingArns = [],
  validNatures = []
}) => {
  const [openProjectHead, setOpenProjectHead] = React.useState<number | null>(null);
  const [openCommittee, setOpenCommittee] = React.useState<number | null>(null);
  const [dateInputs, setDateInputs] = React.useState<{ [key: number]: string[] }>({});
  const [openDatePopover, setOpenDatePopover] = React.useState<number | null>(null);
  const [tempDateInput, setTempDateInput] = React.useState<string>('');
  const [datePicker, setDatePicker] = React.useState<{month: number, day: string, year: string, error: string}>({month: 0, day: '', year: '', error: ''});
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [filteredMembers, setFilteredMembers] = React.useState<Member[]>([]);

  // Debounced search function
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        setIsSearching(true);
        const filtered = members
          .filter(member => 
            member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 10);
        setFilteredMembers(filtered);
        setIsSearching(false);
      } else {
        setFilteredMembers([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, members]);

  // Parse date from sheet format (Month Day, Year)
  const parseDate = (dateStr: string): string | null => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return dateStr;
    } catch {
      return null;
    }
  };

  // Initialize date inputs when events change
  React.useEffect(() => {
    const initialDates: { [key: number]: string[] } = {};
    events.forEach((event, index) => {
      const dates = Array.isArray(event['Target Activity Date']) ? event['Target Activity Date'] : (event['Target Activity Date'] ? [event['Target Activity Date']] : []);
      initialDates[index] = dates.filter(d => parseDate(d));
    });
    setDateInputs(initialDates);
  }, [events]);

  const hasIssues = React.useMemo(() => {
    return events.some((event: Event) => {
      return !event["Activity Title"] ||
        !event["ARN"] ||
        !event.Duration ||
        !event["Activity Nature"] ||
        !event["Activity Type"] ||
        !event["Budget Allocation"] ||
        !event.Venue ||
        !event["Brief Description"] ||
        !event.Goals ||
        !event.Objectives ||
        !event.Strategies ||
        !event.Measures ||
        existingArns.includes(event["ARN"]) ||
        !validNatures.includes(event["Activity Nature"]);
    });
  }, [events, existingArns, validNatures]);

  const hasWarnings = React.useMemo(() => {
    return events.some((event: Event) => {
      return (!event['Project Head'] || !Array.isArray(event['Project Head']) || event['Project Head'].length === 0) ||
        !event['Committee'] ||
        (!dateInputs[events.indexOf(event)] || dateInputs[events.indexOf(event)].length === 0);
    });
  }, [events, dateInputs]);

  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => {
      const aHasIssues =
        !a["Activity Title"] ||
        !a["ARN"] ||
        !a.Duration ||
        !a["Activity Nature"] ||
        !a["Activity Type"] ||
        !a["Budget Allocation"] ||
        !a.Venue ||
        !a["Brief Description"] ||
        !a.Goals ||
        !a.Objectives ||
        !a.Strategies ||
        !a.Measures ||
        existingArns.includes(a["ARN"]) ||
        !validNatures.includes(a["Activity Nature"]);

      const bHasIssues =
        !b["Activity Title"] ||
        !b["ARN"] ||
        !b.Duration ||
        !b["Activity Nature"] ||
        !b["Activity Type"] ||
        !b["Budget Allocation"] ||
        !b.Venue ||
        !b["Brief Description"] ||
        !b.Goals ||
        !b.Objectives ||
        !b.Strategies ||
        !b.Measures ||
        existingArns.includes(b["ARN"]) ||
        !validNatures.includes(b["Activity Nature"]);

      if (aHasIssues && !bHasIssues) return -1;
      if (!aHasIssues && bHasIssues) return 1;
      return 0;
    });
  }, [events, existingArns, validNatures]);

  const handleDateSubmit = (index: number) => {
    const parsedDate = parseDate(tempDateInput);
    if (parsedDate) {
      onDateChange(index, [parsedDate]);
      setDateInputs(prev => ({ ...prev, [index]: [parsedDate] }));
      setOpenDatePopover(null);
      setTempDateInput('');
    }
  };

  return (
    <div className="space-y-4">
      {hasIssues && (
        <div className="rounded-lg bg-destructive/5 p-4 text-sm text-destructive">
          <p className="font-medium">Some events require attention</p>
          <p className="mt-1">Please address these errors in the spreadsheet, and click refresh to see the updated list.</p>
        </div>
      )}
      {hasWarnings && (
        <div className="rounded-lg bg-yellow-500/5 p-4 text-sm text-yellow-600">
          <p className="font-medium">Some events need additional information</p>
          <p className="mt-1">Please assign project heads, committees, and dates to complete the event details.</p>
        </div>
      )}
      {!hasIssues && !hasWarnings && (
        <div className="rounded-lg bg-green-500/5 p-4 text-sm text-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">You're good to go!</p>
              <p className="mt-1">Please double check everything before uploading.</p>
            </div>
            <Button 
              onClick={onUpload}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!onUpload}
            >
              Upload Events
            </Button>
          </div>
        </div>
      )}
      <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
        {sortedEvents.map((event: Event, index: number) => {
          const eventHasIssues =
            !event["Activity Title"] ||
            !event["ARN"] ||
            !event.Duration ||
            !event["Activity Nature"] ||
            !event["Activity Type"] ||
            !event["Budget Allocation"] ||
            !event.Venue ||
            !event["Brief Description"] ||
            !event.Goals ||
            !event.Objectives ||
            !event.Strategies ||
            !event.Measures ||
            existingArns.includes(event["ARN"]) ||
            !validNatures.includes(event["Activity Nature"]);

          // Find the original index in the events array
          const originalIndex = events.findIndex(e => e['Activity Title'] === event['Activity Title']);

          return (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="[&>div]:border-none"
            >
              <AccordionTrigger className={eventHasIssues ? "text-destructive/90 hover:text-destructive" : ""}>
                <div className="flex flex-col items-start gap-1.5">
                  <div className="flex items-center gap-2">
                    {eventHasIssues && (
                      <AlertCircle className="h-4 w-4 text-destructive/80" />
                    )}
                    <span className="font-medium">
                      {event['Activity Title'] || 'Untitled Event'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {!event['ARN'] && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                        Missing ARN
                      </Badge>
                    )}
                    {event['ARN'] && existingArns.includes(event['ARN']) && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                        Duplicate ARN
                      </Badge>
                    )}
                    {event['Activity Nature'] && !validNatures.includes(event['Activity Nature']) && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                        Invalid Event Nature
                      </Badge>
                    )}
                    {event['ARN'] && !existingArns.includes(event['ARN']) && (
                      <Badge variant="outline" className="bg-secondary text-muted-foreground">
                        {event['ARN']}
                      </Badge>
                    )}
                  </div>
                  {!eventHasIssues && (
                    <div className="flex items-center gap-1.5">
                      {(!event['Project Head'] || !Array.isArray(event['Project Head']) || event['Project Head'].length === 0) && (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          No Project Head
                        </Badge>
                      )}
                      {!event['Committee'] && (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          No Committee
                        </Badge>
                      )}
                      {(!dateInputs[index] || dateInputs[index].length === 0) && (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          No Dates
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {!eventHasIssues && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Project Heads</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(event['Project Head']) && event['Project Head'].map((headId) => {
                              const member = members.find(m => m.id === Number(headId));
                              if (!member) return null;
                              return (
                                <div key={headId} className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded-md">
                                  <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-xs">
                                      {member.full_name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">
                                    {member.full_name}
                                  </span>
                                  <button
                                    onClick={() => {
                                      onProjectHeadChange(originalIndex, Number(headId));
                                    }}
                                    className="p-0.5 hover:bg-destructive/10 rounded-sm"
                                  >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                  </button>
                                </div>
                              );
                            })}
                            <Popover open={openProjectHead === index} onOpenChange={(open) => {
                              setOpenProjectHead(open ? index : null);
                              if (!open) {
                                setSearchQuery('');
                                setFilteredMembers([]);
                              }
                            }}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 px-2">
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 max-w-full p-0">
                                <div className="space-y-2">
                                  <div className="flex items-center border-b px-3">
                                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                    <input
                                      className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                      placeholder="Search project head..."
                                      value={searchQuery}
                                      onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        if (e.target.value.length >= 3) {
                                          setIsSearching(true);
                                          const filtered = members
                                            .filter(member => 
                                              member.full_name.toLowerCase().includes(e.target.value.toLowerCase()) ||
                                              member.email.toLowerCase().includes(e.target.value.toLowerCase())
                                            )
                                            .slice(0, 10);
                                          setFilteredMembers(filtered);
                                          setIsSearching(false);
                                        } else {
                                          setFilteredMembers([]);
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="max-h-[300px] overflow-y-auto">
                                    {isSearching ? (
                                      <div className="flex items-center justify-center py-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      </div>
                                    ) : searchQuery.length > 0 ? (
                                      filteredMembers.length > 0 ? (
                                        <div className="p-1">
                                          {filteredMembers.map((member) => (
                                            <button
                                              key={member.id}
                                              onClick={() => {
                                                console.log('Attempting to add project head:', {
                                                  memberId: member.id,
                                                  memberName: member.full_name,
                                                  currentProjectHeads: event['Project Head'],
                                                  originalIndex,
                                                  sortedIndex: index
                                                });
                                                onProjectHeadChange(originalIndex, member.id);
                                                console.log('Project head change called');
                                                setOpenProjectHead(null);
                                                setSearchQuery('');
                                                setFilteredMembers([]);
                                              }}
                                              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                                            >
                                              <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-xs">
                                                  {member.full_name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="flex flex-col flex-1 min-w-0 text-left">
                                                <span className="truncate">{member.full_name}</span>
                                                <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                                              </div>
                                              <Check
                                                className={cn(
                                                  "h-4 w-4 shrink-0",
                                                  Array.isArray(event['Project Head']) && event['Project Head'].includes(member.id.toString()) ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                          No project head found
                                        </div>
                                      )
                                    ) : (
                                      <div className="py-4 text-center text-sm text-muted-foreground">
                                        Start typing to search for members
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Committee</p>
                          <div className="flex flex-wrap gap-2">
                            {event['Committee'] && (
                              <div key={event['Committee']} className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded-md">
                                <span className="text-sm">
                                  {committees.find(c => c.id.toString() === event['Committee'])?.name || 'Unknown Committee'}
                                </span>
                                <button
                                  onClick={() => {
                                    onCommitteeChange(originalIndex, 0);
                                  }}
                                  className="p-0.5 hover:bg-destructive/10 rounded-sm"
                                >
                                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                </button>
                              </div>
                            )}
                            {!event['Committee'] && (
                              <Select
                                onValueChange={(value) => {
                                  const selectedCommittee = committees.find(c => c.name === value);
                                  if (selectedCommittee) {
                                    onCommitteeChange(originalIndex, selectedCommittee.id);
                                  }
                                }}
                              >
                                <SelectTrigger className="h-9 w-[200px]">
                                  <SelectValue placeholder="Select committee" />
                                </SelectTrigger>
                                <SelectContent>
                                  {committees.map((committee) => (
                                    <SelectItem key={committee.id} value={committee.name}>
                                      {committee.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Target Activity Date</p>
                          <div className="flex flex-wrap gap-2">
                            {(dateInputs[index] || []).map((date, dateIdx) => (
                              <div key={dateIdx} className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{date}</span>
                                <button
                                  onClick={() => {
                                    onDateRemove(index, dateIdx);
                                    const newDates = (dateInputs[index] || []).filter((_, i) => i !== dateIdx);
                                    setDateInputs(prev => ({ ...prev, [index]: newDates }));
                                  }}
                                  className="p-1 hover:bg-destructive/10 rounded-sm"
                                >
                                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                </button>
                              </div>
                            ))}
                            <Popover open={openDatePopover === index} onOpenChange={(open) => {
                              setOpenDatePopover(open ? index : null);
                              setDatePicker({month: 0, day: '', year: '', error: ''});
                            }}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 px-2">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 max-w-full">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    <select
                                      className="border rounded px-2 py-1 text-sm min-w-0"
                                      value={datePicker.month}
                                      onChange={e => setDatePicker(p => ({...p, month: Number(e.target.value), error: ''}))}
                                    >
                                      {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                                    </select>
                                    <input
                                      type="number"
                                      min={1}
                                      max={getDaysInMonth(datePicker.month, Number(datePicker.year) || new Date().getFullYear())}
                                      className="border rounded px-2 py-1 w-16 text-sm min-w-0"
                                      placeholder="Day"
                                      value={datePicker.day}
                                      onChange={e => setDatePicker(p => ({...p, day: e.target.value.replace(/[^0-9]/g, ''), error: ''}))}
                                    />
                                    <input
                                      type="number"
                                      min={new Date().getFullYear()}
                                      className="border rounded px-2 py-1 w-20 text-sm min-w-0"
                                      placeholder="Year"
                                      value={datePicker.year}
                                      onChange={e => setDatePicker(p => ({...p, year: e.target.value.replace(/[^0-9]/g, ''), error: ''}))}
                                    />
                                  </div>
                                  {datePicker.error && <div className="text-xs text-destructive">{datePicker.error}</div>}
                                  <Button
                                    className="w-full"
                                    onClick={() => {
                                      const year = Number(datePicker.year);
                                      const day = Number(datePicker.day);
                                      const daysInMonth = getDaysInMonth(datePicker.month, year);
                                      if (!year || !day) {
                                        setDatePicker(p => ({...p, error: 'Please enter a valid day and year.'}));
                                        return;
                                      }
                                      if (year < new Date().getFullYear()) {
                                        setDatePicker(p => ({...p, error: 'Year cannot be in the past.'}));
                                        return;
                                      }
                                      if (day < 1 || day > daysInMonth) {
                                        setDatePicker(p => ({...p, error: 'Invalid day for selected month/year.'}));
                                        return;
                                      }
                                      const formatted = `${MONTHS[datePicker.month]} ${day}, ${year}`;
                                      const newDates = [...(dateInputs[index] || []), formatted];
                                      onDateChange(index, newDates);
                                      setDateInputs(prev => ({ ...prev, [index]: newDates }));
                                      setOpenDatePopover(null);
                                    }}
                                    disabled={!datePicker.day || !datePicker.year}
                                  >
                                    Add
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Duration</p>
                          <p className={cn(
                            "text-sm",
                            !event.Duration ? "text-destructive/80" : "text-muted-foreground"
                          )}>
                            {event.Duration || "Missing"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium">Activity Type</p>
                          <p className={cn(
                            "text-sm",
                            !event["Activity Type"] ? "text-destructive/80" : "text-muted-foreground"
                          )}>
                            {event["Activity Type"] || "Missing"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium">Activity Nature</p>
                          <p className={cn(
                            "text-sm",
                            !event["Activity Nature"] || !validNatures.includes(event["Activity Nature"]) 
                              ? "text-destructive/80" 
                              : "text-muted-foreground"
                          )}>
                            {event["Activity Nature"] || "Missing"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium">Budget Allocation</p>
                          <p className={cn(
                            "text-sm",
                            !event["Budget Allocation"] ? "text-destructive/80" : "text-muted-foreground"
                          )}>
                            {event["Budget Allocation"] || "Missing"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium">Venue</p>
                          <p className={cn(
                            "text-sm",
                            !event.Venue ? "text-destructive/80" : "text-muted-foreground"
                          )}>
                            {event.Venue || "Missing"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {eventHasIssues && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Duration</p>
                          <p className={cn(
                            "text-sm",
                            !event.Duration ? "text-destructive/80" : "text-muted-foreground"
                          )}>
                            {event.Duration || "Missing"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium">Activity Type</p>
                          <p className={cn(
                            "text-sm",
                            !event["Activity Type"] ? "text-destructive/80" : "text-muted-foreground"
                          )}>
                            {event["Activity Type"] || "Missing"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium">Activity Nature</p>
                          <p className={cn(
                            "text-sm",
                            !event["Activity Nature"] ? "text-destructive/80" : "text-muted-foreground"
                          )}>
                            {event["Activity Nature"] || "Missing"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Budget Allocation</p>
                          <p className={cn(
                            "text-sm",
                            !event["Budget Allocation"] ? "text-destructive/80" : "text-muted-foreground"
                          )}>
                            {event["Budget Allocation"] || "Missing"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium">Venue</p>
                          <p className={cn(
                            "text-sm",
                            !event.Venue ? "text-destructive/80" : "text-muted-foreground"
                          )}>
                            {event.Venue || "Missing"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="additional-details">
                      <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline">
                        View Additional Details
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <div className="pt-2">
                            <p className="text-sm font-medium">Brief Description</p>
                            <p className="text-sm text-muted-foreground">
                              {event["Brief Description"] || <span className="text-destructive/80">Missing</span>}
                            </p>
                          </div>
                          <div className="pt-2">
                            <p className="text-sm font-medium">Goals</p>
                            <p className="text-sm text-muted-foreground">
                              {event.Goals || <span className="text-destructive/80">Missing</span>}
                            </p>
                          </div>
                          <div className="pt-2">
                            <p className="text-sm font-medium">Objectives</p>
                            <p className="text-sm text-muted-foreground">
                              {event.Objectives || <span className="text-destructive/80">Missing</span>}
                            </p>
                          </div>
                          <div className="pt-2">
                            <p className="text-sm font-medium">Strategies</p>
                            <p className="text-sm text-muted-foreground">
                              {event.Strategies || <span className="text-destructive/80">Missing</span>}
                            </p>
                          </div>
                          <div className="pt-2">
                            <p className="text-sm font-medium">Measures</p>
                            <p className="text-sm text-muted-foreground">
                              {event.Measures || <span className="text-destructive/80">Missing</span>}
                            </p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default CompactEventList; 