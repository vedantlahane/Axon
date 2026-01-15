/**
 * SQL utility functions for query normalization and comparison
 */

/**
 * Normalize SQL query for consistent comparison/lookup
 * Collapses whitespace, removes leading/trailing spaces per line, and converts to lowercase
 * 
 * @param sql - The SQL query string to normalize
 * @returns Normalized SQL string for use as Map key
 */
export function normalizeSql(sql: string): string {
  return sql
    .trim()
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}
