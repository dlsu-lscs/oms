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
import { FileStatus } from "@/app/types";

const statusConfig = {
  INIT: { 
    label: 'Initialize', 
    variant: 'secondary' as const,
    className: 'bg-gray-500 text-white'
  },
  SENT: { 
    label: 'Sent for Review', 
    variant: 'secondary' as const,
    className: 'bg-yellow-500 text-white'
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
  isLoading?: boolean;
  error?: string | null;
}

export function FileStatusBadge({ fileKey, initialStatus, onStatusChange, isLoading, error }: FileStatusBadgeProps) {
  const [status, setStatus] = useState<FileStatus>(initialStatus ?? 'INIT');
  const { data: session } = useSession();
  const isDoculogi = session?.user?.committeeId?.toString() === 'DOCULOGI';
  const isApproved = status === 'APPROVED';

  useEffect(() => {
    if (initialStatus !== undefined) {
      setStatus(initialStatus);
    }
  }, [initialStatus]);

  const handleStatusChange = async (newStatus: FileStatus) => {
    if (!session?.user) {
      toast.error('Please sign in to update status');
      return;
    }

    try {
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const config = status ? statusConfig[status] : statusConfig.INIT;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge 
          variant={config.variant} 
          className={`${config.className} ${isApproved && !isDoculogi ? 'cursor-default pointer-events-none' : 'cursor-pointer'} flex items-center gap-1`}
          onClick={(e) => isApproved && !isDoculogi && e.preventDefault()}
        >
          {isLoading ? (
            <span className="animate-pulse">Updating...</span>
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : (
            <>
              {config.label}
              {(!isApproved || isDoculogi) && <ChevronDown className="h-3 w-3" />}
            </>
          )}
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