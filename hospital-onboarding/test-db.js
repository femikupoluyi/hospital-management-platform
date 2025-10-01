const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function test() {
  try {
    // Test 1: Simple query without parameters
    console.log('Test 1: Simple query');
    const result1 = await sql`SELECT 1 as test`;
    console.log('Result 1:', result1);

    // Test 2: Query with template literal
    console.log('\nTest 2: Template literal query');
    const status = 'contract_pending';
    const result2 = await sql`SELECT * FROM onboarding.applications WHERE status = ${status} LIMIT 1`;
    console.log('Result 2 found:', result2.length, 'records');

    // Test 3: Check if sql has a query method
    console.log('\nTest 3: Checking sql methods');
    console.log('sql.query exists?', typeof sql.query);
    
    // Test what works for parameterized queries
    if (typeof sql.query === 'function') {
      console.log('\nTest 4: Using sql.query');
      const result4 = await sql.query('SELECT * FROM onboarding.applications WHERE status = $1 LIMIT 1', ['contract_pending']);
      console.log('Result 4 found:', result4.length, 'records');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

test();
