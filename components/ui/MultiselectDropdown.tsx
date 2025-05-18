import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { FileText, Folder } from "lucide-react";

interface Option<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  isFolder?: boolean;
  level: number;
  isLastChild?: boolean;
  hasChildren?: boolean;
  parentFolderId?: string;
  ancestry?: boolean[];
}

interface MultiselectDropdownProps<T = string> {
  options: Option<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  placeholder?: string;
}

export function MultiselectDropdown<T = string>({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select..." 
}: MultiselectDropdownProps<T>) {
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
    (option) => !value.includes(option.value) && 
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  // Render tree lines using ancestry array
  const renderTreePrefix = (option: Option<T>) => {
    if (!option.ancestry) return '';
    return option.ancestry
      .slice(0, -1)
      .map(isLast => (isLast ? '    ' : '│   '))
      .join('');
  };

  const renderTreeIcon = (option: Option<T>) => {
    if (!option.ancestry || option.ancestry.length === 0) return '';
    return option.ancestry[option.ancestry.length - 1] ? '└─ ' : '├─ ';
  };

  return (
    <div className="relative w-[420px]" ref={containerRef}>
      <div
        className={`flex items-center border rounded-md px-3 py-1.5 text-sm bg-background min-w-[120px] gap-2 flex-wrap cursor-text`}
        onClick={() => {
          setFocused(true);
          inputRef.current?.focus();
        }}
      >
        {value.map((val) => {
          const option = options.find((o) => o.value === val);
          return (
            <Badge key={String(val)} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-white text-black border border-border">
              {option?.isFolder ? <Folder className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              {option?.label || String(val)}
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
          style={dropdownWidth ? { width: 420 } : {}}
        >
          {availableOptions.map((option) => (
            <div
              key={String(option.value)}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent whitespace-pre ${
                option.disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => {
                if (!option.disabled) {
                  onChange([...value, option.value]);
                  setSearch("");
                  inputRef.current?.focus();
                }
              }}
            >
              <span className="flex items-center gap-2 font-mono">
                {renderTreePrefix(option)}
                {renderTreeIcon(option)}
                {option.isFolder ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                {option.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 