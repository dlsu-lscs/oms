import { useState, useEffect } from "react";
import { MultiselectDropdown } from "@/components/ui/MultiselectDropdown";
import { Label } from "@/components/ui/label";
import { Folder } from "lucide-react";

interface FinanceTemplate {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  parentFolderId: string;
  parentFolderName: string;
}

interface FinanceTemplateSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function FinanceTemplateSelect({ value, onChange, disabled }: FinanceTemplateSelectProps) {
  const [templates, setTemplates] = useState<FinanceTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/finance-templates', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data) {
          setTemplates(data);
        }
      } catch (error) {
        console.error('Error loading finance templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // Group templates by parent folder
  const groupedTemplates = templates.reduce((acc, template) => {
    const folderName = template.parentFolderName;
    if (!acc[folderName]) {
      acc[folderName] = [];
    }
    acc[folderName].push(template);
    return acc;
  }, {} as Record<string, FinanceTemplate[]>);

  // Create dropdown options with folder headers
  const dropdownOptions = Object.entries(groupedTemplates).flatMap(([folderName, files], folderIndex, folderArray) => {
    const folderOption = {
      label: folderName,
      value: `folder-${folderName}`,
      disabled: true,
      isFolder: true,
      level: 0,
      isLastChild: folderIndex === folderArray.length - 1,
      hasChildren: files.length > 0,
      ancestry: [folderIndex === folderArray.length - 1]
    };

    const fileOptions = files.map((file, fileIndex) => ({
      label: file.name,
      value: file.id,
      disabled: false,
      isFolder: false,
      level: 1,
      isLastChild: fileIndex === files.length - 1,
      hasChildren: false,
      parentFolderId: file.parentFolderId,
      ancestry: [folderIndex === folderArray.length - 1, fileIndex === files.length - 1]
    }));

    return [folderOption, ...fileOptions];
  });

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Finance Templates</Label>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
            <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
          </div>
        ) : (
          <MultiselectDropdown
            options={dropdownOptions}
            value={value}
            onChange={onChange}
            placeholder="Select finance templates..."
          />
        )}
      </div>
    </div>
  );
} 