import { neon, NeonQueryFunction } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

export const sql = neon(process.env.DATABASE_URL);

// Database helper functions that properly handles parameterized queries
export async function executeQuery(query: string, params?: any[]) {
  try {
    // Use sql.query for parameterized queries (Neon v0.6.0+)
    let result;
    if (!params || params.length === 0) {
      // No parameters, use sql.query without params
      result = await (sql as any).query(query);
    } else {
      // With parameters, use sql.query with params array
      result = await (sql as any).query(query, params);
    }
    return { success: true, data: result };
  } catch (error) {
    console.error('Database query error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Transaction helper
export async function executeTransaction(queries: { query: string; params?: any[] }[]) {
  try {
    await sql`BEGIN`;
    const results = [];
    
    for (const { query, params } of queries) {
      const result = await executeQuery(query, params);
      if (!result.success) {
        throw new Error(result.error || 'Transaction query failed');
      }
      results.push(result.data);
    }
    
    await sql`COMMIT`;
    return { success: true, data: results };
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('Transaction error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
