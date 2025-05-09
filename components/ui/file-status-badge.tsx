import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type FileStatus = 'NOT_STARTED' | 'DRAFTING' | 'DONE' | 'REVISE' | 'APPROVED';

const statusConfig = {
  NOT_STARTED: { 
    label: 'Not Started', 
    variant: 'secondary' as const,
    className: 'bg-secondary text-secondary-foreground'
  },
  DRAFTING: { 
    label: 'Drafting', 
    variant: 'secondary' as const,
    className: 'bg-gray-500 text-white'
  },
  DONE: { 
    label: 'Done', 
    variant: 'secondary' as const,
    className: 'bg-white text-gray-900 border border-gray-200'
  },
  REVISE: { 
    label: 'For Revision', 
    variant: 'destructive' as const,
    className: 'bg-orange-500 text-white'
  },
  APPROVED: { 
    label: 'Approved', 
    variant: 'secondary' as const,
    className: 'bg-green-500 text-white'
  },
};

interface FileStatusBadgeProps {
  fileKey: string;
  initialStatus?: FileStatus;
  onStatusChange?: (newStatus: FileStatus) => void;
}

export function FileStatusBadge({ fileKey, initialStatus, onStatusChange }: FileStatusBadgeProps) {
  const [status, setStatus] = useState<FileStatus>(initialStatus || 'NOT_STARTED');
  const { data: session } = useSession();
  const isDoculogi = session?.user?.committeeId?.toString() === 'DOCULOGI';

  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus);
    }
  }, [initialStatus]);

  const handleStatusChange = async (newStatus: FileStatus) => {
    if (!session?.user) {
      toast.error('Please sign in to update status');
      return;
    }

    if (['REVISE', 'APPROVED'].includes(newStatus) && !isDoculogi) {
      toast.error('Only DOCULOGI members can set this status');
      return;
    }

    try {
      const response = await fetch('/api/events/file-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey, status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }
      
      setStatus(newStatus);
      onStatusChange?.(newStatus);
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const config = statusConfig[status];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge 
          variant={config.variant} 
          className={`cursor-pointer flex items-center gap-1 ${config.className}`}
        >
          {config.label}
          <ChevronDown className="h-3 w-3" />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.entries(statusConfig).map(([key, { label, className }]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleStatusChange(key as FileStatus)}
            disabled={['REVISE', 'APPROVED'].includes(key) && !isDoculogi}
            className="flex items-center justify-between"
          >
            <Badge 
              variant="secondary" 
              className={`ml-2 ${className}`}
            >
              {label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 