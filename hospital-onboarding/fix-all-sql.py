#!/usr/bin/env python3
import os
import re
import glob

# Find all TypeScript files with SQL issues
files_to_fix = [
    "src/app/api/crm/appointments/route.ts",
    "src/app/api/crm/campaigns/route.ts", 
    "src/app/api/crm/owners/payouts/route.ts",
    "src/app/api/crm/owners/route.ts",
    "src/app/api/crm/patients/route.ts"
]

def fix_file(filepath):
    print(f"Fixing {filepath}...")
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if already has executeQuery imported
    if "executeQuery" not in content:
        # Add executeQuery to import
        content = content.replace(
            "import { sql } from '@/lib/db';",
            "import { sql, executeQuery } from '@/lib/db';"
        )
    
    # Find all instances of await sql(query, params) pattern
    pattern = r'await sql\(([^,]+),\s*([^\)]+)\)'
    
    def replace_sql_call(match):
        query_var = match.group(1).strip()
        params_var = match.group(2).strip()
        
        # Generate replacement code
        return f"""executeQuery({query_var}, {params_var}).then(result => {{
      if (!result.success) throw new Error(result.error || 'Query failed');
      return result.data;
    }})"""
    
    # Replace all occurrences
    # Actually, let's use a simpler approach - just wrap in executeQuery
    
    # Find lines with await sql( that are not template literals
    lines = content.split('\n')
    new_lines = []
    
    for i, line in enumerate(lines):
        if 'await sql(' in line and 'await sql`' not in line:
            # Extract the variable name being assigned to
            assign_match = re.match(r'(\s*)const\s+(\w+)\s*=\s*await sql\(([^,]+),\s*([^\)]+)\);?', line)
            if assign_match:
                indent = assign_match.group(1)
                var_name = assign_match.group(2)
                query_var = assign_match.group(3)
                params_var = assign_match.group(4)
                
                # Replace with executeQuery pattern
                new_lines.append(f'{indent}const result = await executeQuery({query_var}, {params_var});')
                new_lines.append(f'{indent}if (!result.success) throw new Error(result.error || "Query failed");')
                new_lines.append(f'{indent}const {var_name} = result.data;')
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
    
    content = '\n'.join(new_lines)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Fixed {filepath}")

# Fix all files
for filepath in files_to_fix:
    full_path = f"/root/hospital-onboarding/{filepath}"
    if os.path.exists(full_path):
        fix_file(full_path)

print("All files fixed!")
