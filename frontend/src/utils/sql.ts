// ─── SQL Utilities ───────────────────────────────────────────────────────────

export function normalizeSql(sql: string): string {
  return sql.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function detectSqlBlocks(content: string): RegExpMatchArray[] {
  const regex = /```sql\s*([\s\S]*?)```/gi;
  return [...content.matchAll(regex)];
}

export function detectSources(content: string): string[] {
  const sources: string[] = [];
  if (
    content.includes('tavily_search') ||
    content.includes('searched the web') ||
    content.includes('search results') ||
    content.includes('According to')
  )
    sources.push('Web Search');
  if (
    content.includes('Document excerpts') ||
    content.includes('search_pdf') ||
    content.includes('uploaded document') ||
    content.includes('PDF')
  )
    sources.push('Uploaded Documents');
  if (
    content.includes('database schema') ||
    content.includes('```sql') ||
    content.includes('get_database_schema')
  )
    sources.push('Database');
  return sources;
}
