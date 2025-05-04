import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChevronRight } from "lucide-react";
import React from "react";

type EventCardProps = {
  imageSrc: string | null;
  altText?: string;
  badgeText: string;
  title: string;
  deadlineText: string;
  onClick?: () => void;
};

export default function EventCard({
  imageSrc,
  altText = "Event visual",
  badgeText,
  title,
  deadlineText,
  onClick,
}: EventCardProps) {
  return (
    <div 
      className="relative cursor-pointer"
      onClick={onClick}
    >
      <div className="max-w-xs overflow-hidden rounded-lg shadow-sm hover:bg-accent hover:transition-all hover:duration-100 hover:shadow-md">
        <div className="relative h-48 w-full">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={altText}
              fill
              className="rounded-md object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted/30 flex items-center justify-center rounded-md">
              <span className="text-2xl font-bold text-primary">
                {title
                  .split(' ')
                  .map(word => word[0])
                  .join('')
                  .toUpperCase()}
              </span>
            </div>
          )}
          <Badge variant="secondary" className="absolute left-2 top-2 text-xs">
            {badgeText}
          </Badge>
        </div>

        <div className="flex flex-row py-2 px-3">
          <div className="flex flex-grow flex-col items-start justify-between">
            <div className="flex flex-row">
              <h3 className="text-xl font-semibold">{title}</h3>
            </div>
            <div className="flex items-center gap-2 text-sm justify-items-center">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{deadlineText}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label="Manage event"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>
      </div>
    </div>
  );
}
