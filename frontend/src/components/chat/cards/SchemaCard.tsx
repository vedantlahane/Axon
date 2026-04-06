import React, { useState } from 'react';
import Badge from '../../ui/Badge';

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
  unique?: boolean;
}

interface Table {
  name: string;
  columns: Column[];
}

interface SchemaCardProps {
  tables: Table[];
  onTableSelect?: (tableName: string) => void;
}

const SchemaCard: React.FC<SchemaCardProps> = ({ tables, onTableSelect }) => {
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  return (
    <div className="liquid-glass rounded-lg p-4 mb-3 border border-white/10">
      <h3 className="font-semibold text-on-surface mb-3">Database Schema</h3>
      <div className="space-y-2">
        {tables.map((table) => (
          <div key={table.name}>
            <button
              onClick={() => {
                setExpandedTable(expandedTable === table.name ? null : table.name);
                onTableSelect?.(table.name);
              }}
              className="w-full flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">table_chart</span>
                <span className="font-medium text-on-surface">{table.name}</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">
                {expandedTable === table.name ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {expandedTable === table.name && (
              <div className="pl-8 space-y-1 py-2">
                {table.columns.map((col) => (
                  <div key={col.name} className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant font-mono">{col.name}</span>
                    <div className="flex gap-1">
                      <Badge variant="info" size="sm">{col.type}</Badge>
                      {col.primaryKey && <Badge variant="success" size="sm">PK</Badge>}
                      {col.unique && <Badge variant="violet" size="sm">UNIQUE</Badge>}
                      {!col.nullable && <Badge variant="warning" size="sm">NOT NULL</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchemaCard;
