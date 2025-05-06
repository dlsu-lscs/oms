import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface MultiselectDropdownProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function MultiselectDropdown({ options, value, onChange, placeholder = "Select..." }: MultiselectDropdownProps) {
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setDropdownWidth(containerRef.current.offsetWidth);
    }
  }, [containerRef.current, value, search]);

  const availableOptions = options.filter(
    (option) => !value.includes(option.value) && option.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-1/2" ref={containerRef}>
      <div
        className={`flex items-center border rounded-md px-3 py-1.5 text-sm bg-background min-w-[120px] gap-2 flex-wrap cursor-text`}
        onClick={() => {
          setFocused(true);
          inputRef.current?.focus();
        }}
      >
        {value.map((val) => {
          const label = options.find((o) => o.value === val)?.label || val;
          return (
            <Badge key={val} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-white text-black border border-border">
              {label}
              <button
                type="button"
                className="ml-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={e => {
                  e.stopPropagation();
                  onChange(value.filter((v) => v !== val));
                }}
              >
                ×
              </button>
            </Badge>
          );
        })}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 outline-none bg-transparent text-sm min-w-[60px]"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={value.length === 0 ? placeholder : ""}
        />
      </div>
      {focused && availableOptions.length > 0 && (
        <div
          className="absolute z-10 left-0 mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto text-sm"
          style={dropdownWidth ? { width: dropdownWidth } : {}}
        >
          {availableOptions.map((option) => (
            <div
              key={option.value}
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent whitespace-nowrap"
              onClick={() => {
                onChange([...value, option.value]);
                setSearch("");
                inputRef.current?.focus();
              }}
            >
              <span>{option.label}</span>
              <FileText className="w-4 h-4 ml-2 text-muted-foreground" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 