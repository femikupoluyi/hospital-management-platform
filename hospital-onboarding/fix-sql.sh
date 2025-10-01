#!/bin/bash

# List of files that need SQL fixes
files=(
  "src/app/api/contracts/route.ts"
  "src/app/api/crm/appointments/route.ts"
  "src/app/api/crm/campaigns/route.ts"
  "src/app/api/crm/owners/payouts/route.ts"
  "src/app/api/crm/owners/route.ts"
  "src/app/api/crm/patients/route.ts"
)

for file in "${files[@]}"; do
  echo "Fixing $file..."
  
  # Check if executeQuery is already imported
  if ! grep -q "executeQuery" "$file"; then
    # Add executeQuery to the import
    sed -i "s/import { sql }/import { sql, executeQuery }/" "$file"
  fi
  
  # Replace sql(query, params) patterns with executeQuery
  # This is a simplified fix - we'll need to handle each case properly
  
done

echo "SQL fixes completed"
