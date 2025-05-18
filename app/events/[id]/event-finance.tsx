import { useState, useEffect } from 'react';

export default function EventFinance() {
  const [financeTemplates, setFinanceTemplates] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFinanceTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/finance-templates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch finance templates');
      }

      const data = await response.json();
      setFinanceTemplates(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching finance templates:', error);
      setError('Failed to load finance templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceTemplates();
  }, []);

  if (isLoading) {
    return <div>Loading finance templates...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Finance Templates</h2>
      <div className="space-y-4">
        {financeTemplates.map((template) => (
          <div key={template.id} className="p-4 border rounded-lg">
            <h3 className="font-semibold">{template.name}</h3>
            {template.isFolder ? (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Folder</p>
                {template.children && template.children.length > 0 && (
                  <div className="ml-4 mt-2">
                    {template.children.map((child: any) => (
                      <div key={child.id} className="text-sm">
                        {child.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-gray-600">File</p>
                <a
                  href={template.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View File
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 