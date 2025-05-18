"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Calendar, ChevronsUpDown, Loader2, Search, X, Plus } from "lucide-react";
import { format, isValid, parse } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useSession } from "next-auth/react";

interface Member {
  id: number;
  full_name: string;
  email: string;
}

interface FinanceEvent {
  id: number;
  arn: string;
  event_name: string;
  budget_allocation: number;
  fin_head_id: number;
  fin_head_fullname: string;
  fin_head_email: string;
  fin_preacts_deadline: Date | null;
  fin_preacts_status: string;
  fin_postacts_deadline: Date | null;
  fin_postacts_status: string;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const statusColorMap = {
  // Green statuses
  APPROVED: 'bg-green-500 text-white',
  
  // Orange statuses
  REVISE: 'bg-orange-500 text-white',
  
  // Yellow statuses
  DRAFTING: 'bg-yellow-500 text-white',
  SIGNATURES: 'bg-yellow-500 text-white',
  
  // Grey statuses (default)
  INIT: 'bg-gray-500 text-white',
  PENDED: 'bg-gray-500 text-white',
  SUBMITTED: 'bg-gray-500 text-white',
};

const statusLabels = {
  INIT: 'Not Started',
  DRAFTING: 'In Progress',
  REVISE: 'For Revision',
  SIGNATURES: 'Gathering Signatures',
  SUBMITTED: 'Submitted to CSO',
  APPROVED: 'Approved by CSO',
  PENDED: 'Pended',
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

export default function FinanceDashboard() {
  const [events, setEvents] = useState<FinanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [openFinHead, setOpenFinHead] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [openDatePicker, setOpenDatePicker] = useState<{ id: number; type: 'fin_preacts' | 'fin_postacts' } | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events/finance');
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

  const handleFinHeadAssign = async (eventId: number, memberId: number) => {
    try {
      const response = await fetch('/api/events/finance/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId, finHeadId: memberId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign finance head');
      }

      // Update the local state
      setEvents(prevEvents => 
        prevEvents.map(event => {
          if (event.id === eventId) {
            const member = members.find(m => m.id === memberId);
            return {
              ...event,
              fin_head_id: memberId,
              fin_head_fullname: member?.full_name || '',
              fin_head_email: member?.email || '',
            };
          }
          return event;
        })
      );
      setOpenFinHead(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Error assigning finance head:', error);
    }
  };

  const handleDateSelect = async (eventId: number, type: 'fin_preacts' | 'fin_postacts', date: string) => {
    try {
      const response = await fetch(`/api/events/finance/${type}/deadline`, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 divide-y gap-0 divide-border/50">
      {events.map((event: FinanceEvent) => (
        <div key={event.id} className="py-1">
          <div className="flex flex-col md:flex-row lg:items-start gap-6 lg:gap-8 bg-muted/50 p-4 rounded-md">
            {/* Title and ARN */}
            <div className="w-full lg:w-1/4 min-w-0">
              <div className="space-y-2">
                <h3 className="text-base text-lg font-medium line-clamp-2">
                  {event.event_name}
                </h3>
                <Badge variant="outline" className="text-xs w-fit">{event.arn}</Badge>
                <div className="text-sm font-medium">
                  ₱{event.budget_allocation?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Finance Preacts */}
            <div className="w-full lg:w-1/4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">FINANCE PREACTS DEADLINE</h4>
                <div className="flex flex-col gap-2">
                  {event.fin_preacts_deadline ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md w-fit">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(event.fin_preacts_deadline)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDateSelect(event.id, 'fin_preacts', '');
                        }}
                        className="p-1 hover:bg-destructive/10 rounded-sm"
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <Popover 
                      open={openDatePicker?.id === event.id && openDatePicker?.type === 'fin_preacts'}
                      onOpenChange={(open) => setOpenDatePicker(open ? { id: event.id, type: 'fin_preacts' } : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 px-2 w-fit">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <DatePickerPopover
                          currentDate={event.fin_preacts_deadline}
                          onDateSelect={(date) => handleDateSelect(event.id, 'fin_preacts', date)}
                          onClose={() => setOpenDatePicker(null)}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                  <Badge 
                    variant="secondary" 
                    className={`w-fit ${statusColorMap[event.fin_preacts_status as keyof typeof statusColorMap] || 'bg-gray-500 text-white'}`}
                  >
                    {statusLabels[event.fin_preacts_status as keyof typeof statusLabels] || event.fin_preacts_status || 'No Tracker Found'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Finance Postacts */}
            <div className="w-full lg:w-1/4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">FINANCE POSTACTS DEADLINE</h4>
                <div className="flex flex-col gap-2">
                  {event.fin_postacts_deadline ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md w-fit">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(event.fin_postacts_deadline)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDateSelect(event.id, 'fin_postacts', '');
                        }}
                        className="p-1 hover:bg-destructive/10 rounded-sm"
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <Popover 
                      open={openDatePicker?.id === event.id && openDatePicker?.type === 'fin_postacts'}
                      onOpenChange={(open) => setOpenDatePicker(open ? { id: event.id, type: 'fin_postacts' } : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 px-2 w-fit">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <DatePickerPopover
                          currentDate={event.fin_postacts_deadline}
                          onDateSelect={(date) => handleDateSelect(event.id, 'fin_postacts', date)}
                          onClose={() => setOpenDatePicker(null)}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                  <Badge 
                    variant="secondary" 
                    className={`w-fit ${statusColorMap[event.fin_postacts_status as keyof typeof statusColorMap] || 'bg-gray-500 text-white'}`}
                  >
                    {statusLabels[event.fin_postacts_status as keyof typeof statusLabels] || event.fin_postacts_status || 'No Tracker Found'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Finance Head */}
            <div className="w-full lg:w-1/4 flex flex-col gap-2 items-start">
              <h4 className="text-sm font-medium text-muted-foreground">FINANCE HEAD</h4>
              <Popover 
                open={openFinHead === event.id} 
                onOpenChange={(open) => {
                  setOpenFinHead(open ? event.id : null);
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
                    {event.fin_head_fullname ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {event.fin_head_fullname.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{event.fin_head_fullname}</span>
                      </div>
                    ) : (
                      "Select finance head..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                      className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Search finance head..."
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
                              handleFinHeadAssign(event.id, member.id);
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
  );
} 