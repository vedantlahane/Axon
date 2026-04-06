import React from 'react';
import Button from '../../ui/Button';

interface QueryResultsTableProps {
  columns: string[];
  rows: Array<Record<string, any>>;
  executionTime: number;
  rowCount: number;
  onExportCSV?: () => void;
  onExportXLSX?: () => void;
  onVisualize?: () => void;
}

const QueryResultsTable: React.FC<QueryResultsTableProps> = ({
  columns,
  rows,
  executionTime,
  rowCount,
  onExportCSV,
  onExportXLSX,
  onVisualize,
}) => {
  return (
    <div className="liquid-glass rounded-lg p-4 mb-3 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-on-surface">Query Results</h3>
          <p className="text-sm text-on-surface-variant">
            {rowCount} rows • {executionTime}ms
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left text-on-surface-variant font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 5).map((row, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 text-on-surface">
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 5 && <p className="text-xs text-on-surface-variant mt-2">... and {rows.length - 5} more rows</p>}
      </div>

      {/* Footer */}
      <div className="flex gap-2">
        {onExportCSV && <Button variant="ghost" size="sm" onClick={onExportCSV}>Export CSV</Button>}
        {onExportXLSX && <Button variant="ghost" size="sm" onClick={onExportXLSX}>Export XLSX</Button>}
        {onVisualize && <Button variant="glass" size="sm" onClick={onVisualize}>Visualize</Button>}
      </div>
    </div>
  );
};

export default QueryResultsTable;
