"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Calendar, ChevronsUpDown, Loader2, Search, X, Plus, ClipboardList } from "lucide-react";
import { format, isValid, parse } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { EventSidebar } from "./events/event-sheet";
import { Event } from "@/app/types";

interface Member {
  id: number;
  full_name: string;
  email: string;
}

interface DocuLogiEvent {
  id: number;
  arn: string;
  title: string;
  event_name: string;
  committee: string;
  duration: string;
  type: string;
  nature: string;
  eventVisual?: string;
  event_post_caption?: string;
  project_heads?: string;
  venue?: string;
  budget_allocation?: number;
  brief_description?: string;
  goals?: string;
  objectives?: string;
  strategies?: string;
  measures?: string;
  preacts_deadline: Date | null;
  preacts_status: string;
  postacts_deadline: Date | null;
  postacts_status: string;
  docu_head_id: number;
  docu_head_fullname: string;
  docu_head_nickname: string;
  docu_head_email: string;
  docu_head_telegram: string;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
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

function DatePickerPopover({ 
  currentDate, 
  onDateSelect, 
  onClose 
}: { 
  currentDate: Date | null;
  onDateSelect: (date: string) => void;
  onClose: () => void;
}) {
  const [month, setMonth] = useState(currentDate ? format(currentDate, 'MMMM') : '');
  const [day, setDay] = useState(currentDate ? format(currentDate, 'd') : '');
  const [year, setYear] = useState(currentDate ? format(currentDate, 'yyyy') : '');
  const [error, setError] = useState('');

  const validateAndSubmit = () => {
    if (!month || !day || !year) {
      setError('All fields are required');
      return;
    }

    const dateStr = `${month} ${day}, ${year}`;
    const parsedDate = parse(dateStr, 'MMMM d, yyyy', new Date());
    
    if (!isValid(parsedDate)) {
      setError('Invalid date');
      return;
    }

    const today = new Date();
    if (parsedDate < today) {
      setError('Date cannot be in the past');
      return;
    }

    onDateSelect(dateStr);
    onClose();
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-3">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input
          type="number"
          placeholder="Day"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          min="1"
          max="31"
          className="w-20"
        />
        <Input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          min={new Date().getFullYear()}
          className="w-24"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={validateAndSubmit}>Confirm</Button>
      </div>
    </div>
  );
}

export default function DocuLogiEvents() {
  const [events, setEvents] = useState<DocuLogiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [openDocuHead, setOpenDocuHead] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [openDatePicker, setOpenDatePicker] = useState<{ id: number; type: 'preacts' | 'postacts' } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { data: session } = useSession();
  const isDoculogi = session?.user?.committeeId?.toString() === 'DOCULOGI';

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events/doculogi');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchMembers() {
      try {
        const response = await fetch('/api/members');
        if (!response.ok) {
          throw new Error('Failed to fetch members');
        }
        const data = await response.json();
        setMembers(data);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    }

    fetchEvents();
    fetchMembers();
  }, []);

  // Filter members based on search query
  useEffect(() => {
    if (searchQuery.length >= 3) {
      const filtered = members
        .filter(member => 
          member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 10);
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers([]);
    }
  }, [searchQuery, members]);

  const handleDocuHeadAssign = async (eventId: number, memberId: number) => {
    try {
      const response = await fetch('/api/events/doculogi/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId, docuHeadId: memberId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign docu head');
      }

      // Update the local state
      setEvents(prevEvents => 
        prevEvents.map(event => {
          if (event.id === eventId) {
            const member = members.find(m => m.id === memberId);
            return {
              ...event,
              docu_head_id: memberId,
              docu_head_fullname: member?.full_name || '',
              docu_head_nickname: '',
              docu_head_email: member?.email || '',
              docu_head_telegram: '',
            };
          }
          return event;
        })
      );
      setOpenDocuHead(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Error assigning docu head:', error);
    }
  };

  const handleDateSelect = async (eventId: number, type: 'preacts' | 'postacts', date: string) => {
    try {
      const response = await fetch(`/api/events/doculogi/${type}/deadline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId, deadline: date || null }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${type} deadline`);
      }

      setEvents(prevEvents =>
        prevEvents.map(event => {
          if (event.id === eventId) {
            return {
              ...event,
              [`${type}_deadline`]: date || null,
            };
          }
          return event;
        })
      );
    } catch (error) {
      console.error(`Error updating ${type} deadline:`, error);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'MMMM d, yyyy');
    } catch {
      return '';
    }
  };

  const handleEventClick = (event: DocuLogiEvent) => {
    const eventData: Event = {
      id: event.id,
      arn: event.arn,
      event_name: event.event_name,
      committee: event.committee,
      duration: event.duration,
      type: event.type,
      nature: event.nature,
      eventVisual: event.eventVisual,
      event_post_caption: event.event_post_caption,
      project_heads: event.project_heads,
      venue: event.venue,
      budget_allocation: event.budget_allocation,
      brief_description: event.brief_description,
      goals: event.goals,
      objectives: event.objectives,
      strategies: event.strategies,
      measures: event.measures
    };
    setSelectedEvent(eventData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 divide-y gap-0 divide-border/50">
        {events.map((event: DocuLogiEvent) => (
          <div key={event.id} className="py-1">
            <div className="flex flex-col md:flex-row lg:items-start gap-6 lg:gap-8 bg-muted/50 p-4 rounded-md">
              {/* Title and ARN */}
              <div className="w-full lg:w-1/4 min-w-0">
                <div className="space-y-2">
                  <h3 
                    className="text-base text-lg font-medium line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleEventClick(event)}
                  >
                    {event.title}
                  </h3>
                  <Badge variant="outline" className="text-xs w-fit">{event.arn}</Badge>
                </div>
              </div>

              {/* Preacts */}
              <div className="w-full lg:w-1/4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">PREACTS DEADLINE</h4>
                  <div className="flex flex-col gap-2">
                    {event.preacts_deadline ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md w-fit">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(event.preacts_deadline)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDateSelect(event.id, 'preacts', '');
                          }}
                          className="p-1 hover:bg-destructive/10 rounded-sm"
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ) : (
                      <Popover 
                        open={openDatePicker?.id === event.id && openDatePicker?.type === 'preacts'}
                        onOpenChange={(open) => setOpenDatePicker(open ? { id: event.id, type: 'preacts' } : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 px-2 w-fit">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <DatePickerPopover
                            currentDate={event.preacts_deadline}
                            onDateSelect={(date) => handleDateSelect(event.id, 'preacts', date)}
                            onClose={() => setOpenDatePicker(null)}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                    <Badge 
                      variant="secondary" 
                      className={`w-fit ${statusColorMap[event.preacts_status as keyof typeof statusColorMap] || 'bg-gray-500 text-white'}`}
                    >
                      {statusLabels[event.preacts_status as keyof typeof statusLabels] || event.preacts_status || 'No Tracker Found'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Postacts */}
              <div className="w-full lg:w-1/4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">POSTACTS DEADLINE</h4>
                  <div className="flex flex-col gap-2">
                    {event.postacts_deadline ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md w-fit">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(event.postacts_deadline)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDateSelect(event.id, 'postacts', '');
                          }}
                          className="p-1 hover:bg-destructive/10 rounded-sm"
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ) : (
                      <Popover 
                        open={openDatePicker?.id === event.id && openDatePicker?.type === 'postacts'}
                        onOpenChange={(open) => setOpenDatePicker(open ? { id: event.id, type: 'postacts' } : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 px-2 w-fit">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <DatePickerPopover
                            currentDate={event.postacts_deadline}
                            onDateSelect={(date) => handleDateSelect(event.id, 'postacts', date)}
                            onClose={() => setOpenDatePicker(null)}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                    <Badge 
                      variant="secondary" 
                      className={`w-fit ${statusColorMap[event.postacts_status as keyof typeof statusColorMap] || 'bg-gray-500 text-white'}`}
                    >
                      {statusLabels[event.postacts_status as keyof typeof statusLabels] || event.postacts_status || 'No Tracker Found'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Manage Requests and Docu Head */}
              <div className="w-full lg:w-1/4 flex flex-col gap-2 items-start">
                <h4 className="text-sm font-medium text-muted-foreground">DOCU-IN-CHARGE</h4>
                <Popover 
                  open={openDocuHead === event.id} 
                  onOpenChange={(open) => {
                    setOpenDocuHead(open ? event.id : null);
                    if (!open) {
                      setSearchQuery('');
                      setFilteredMembers([]);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-fit justify-between"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {event.docu_head_fullname ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {event.docu_head_fullname.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{event.docu_head_fullname}</span>
                        </div>
                      ) : (
                        "Select docu head..."
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <input
                        className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Search docu head..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {searchQuery && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchQuery('');
                          }}
                          className="ml-2 p-1 hover:bg-accent rounded-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {searchQuery.length < 3 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          Type at least 3 characters to search
                        </div>
                      ) : filteredMembers.length > 0 ? (
                        <div className="p-1">
                          {filteredMembers.map((member) => (
                            <button
                              key={member.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDocuHeadAssign(event.id, member.id);
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
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          No results found
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        ))}
      </div>

      <EventSidebar
        open={!!selectedEvent}
        event={selectedEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      />
    </>
  );
} 