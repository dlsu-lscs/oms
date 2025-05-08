import React from 'react';
import { Stepper } from './ui/stepper';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle2, AlertCircle, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { useEventSheet } from '@/components/events/event-store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface UploadError {
  index: number;
  error: string;
  eventId?: number;
}

interface UploadStepperProps {
  totalEvents: number;
  currentIndex: number;
  errors: UploadError[];
  isUploading: boolean;
  events: any[];
  onSendEmail?: () => void;
}

const UploadStepper: React.FC<UploadStepperProps> = ({
  totalEvents,
  currentIndex,
  errors,
  isUploading,
  events,
  onSendEmail
}) => {
  const { openEventSheet } = useEventSheet();

  const getStepStatus = (index: number): "complete" | "current" | "upcoming" => {
    // If there are errors, mark the failed step as current
    const error = errors.find(e => e.index === index);
    if (error) {
      return "current";
    }
    
    if (index < currentIndex) {
      return "complete";
    }
    if (index === currentIndex) {
      return isUploading ? "current" : "current";
    }
    return "upcoming";
  };

  const getStepIcon = (index: number) => {
    const status = getStepStatus(index);
    const error = errors.find(e => e.index === index);

    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-4 w-4" />;
      case "current":
        if (error) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{error.error || 'Error occurred during upload'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        return isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStepDescription = (index: number) => {
    const status = getStepStatus(index);
    const error = errors.find(e => e.index === index) as UploadError | undefined;
    const event = events[index];

    switch (status) {
      case "complete":
        return {
          text: 'Successfully uploaded',
          type: 'success',
          className: 'text-primary',
          action: event ? {
            label: 'View Event',
            onClick: () => {
              const eventData = {
                id: error?.eventId ?? 0,
                arn: event['ARN'],
                event_name: event['Activity Title'],
                start: new Date(event['Target Activity Date'][0]),
                end: new Date(event['Target Activity Date'][0]),
                duration: event.Duration,
                type: event['Activity Type'],
                committee: event['Committee'],
                nature: event['Activity Nature']
              };
              openEventSheet(eventData);
            }
          } : undefined
        };
      case "current":
        if (error) {
          return {
            text: 'Failed to upload',
            subtext: error.error,
            type: 'error',
            className: 'text-destructive'
          };
        }
        return {
          text: isUploading ? 'Uploading...' : 'Waiting to upload...',
          type: 'info'
        };
      default:
        return {
          text: 'Waiting...',
          type: 'info'
        };
    }
  };

  const steps = events.map((event, index) => {
    const description = getStepDescription(index);
    return {
      title: event['Activity Title'],
      description: description.text,
      subtext: description.subtext,
      status: getStepStatus(index),
      icon: getStepIcon(index),
      actionButton: description.action,
      className: description.className
    };
  });

  // Add final step if all events are processed and there are no errors
  if (currentIndex >= totalEvents && errors.length === 0) {
    steps.push({
      title: 'Upload Complete',
      description: 'Inserting finished. You may now send an email to the Documentations and Finance VPs.',
      subtext: undefined,
      status: 'complete',
      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
      actionButton: onSendEmail ? {
        label: 'Send Email',
        onClick: onSendEmail
      } : undefined,
      className: undefined
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Upload Progress</h2>
      <Stepper steps={steps} />
      {currentIndex >= totalEvents && errors.length === 0 && onSendEmail && (
        <div className="flex justify-end mt-4">
          <Button
            onClick={onSendEmail}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Send Email to VPs
          </Button>
        </div>
      )}
    </div>
  );
};

export default UploadStepper; 