#!/bin/bash

# Schema Validation Script for National Security Platform
# This script validates SQL schema execution order and dependencies

echo "=== Schema Validation Report ==="
echo "Checking schema files in platform/schema/"
echo

# Check if all SQL files are properly numbered
echo "1. Checking file naming convention:"
ls platform/schema/*.sql | grep -E '^[0-9]{3}_' | sort -n
echo

# Check for missing numbers in sequence
echo "2. Checking for missing migration numbers:"
expected_files=$(ls platform/schema/*.sql | grep -E '^[0-9]{3}_' | wc -l)
echo "Found $expected_files migration files"

# List any gaps in numbering
ls platform/schema/*.sql | grep -E '^[0-9]{3}_' | sed 's/.*\///' | sed 's/_.*//' | sort -n | awk '
BEGIN { prev = 0 }
{ 
    curr = $1
    if (prev != 0 && curr > prev + 1) {
        for (i = prev + 1; i < curr; i++) {
            print "Missing migration: " sprintf("%03d", i)
        }
    }
    prev = curr
}
'
echo

# Check for CREATE TABLE statements
echo "3. Tables created in each migration:"
for file in platform/schema/*.sql; do
    filename=$(basename "$file")
    tables=$(grep -i "CREATE TABLE" "$file" | sed 's/.*CREATE TABLE IF NOT EXISTS \([^(]*\).*/\1/i' | tr '\n' ', ' | sed 's/,$//')
    if [ -n "$tables" ]; then
        echo "$filename: $tables"
    fi
done | sort
echo

# Check for ALTER TABLE statements (dependencies)
echo "4. Table modifications (ALTER TABLE):"
for file in platform/schema/*.sql; do
    filename=$(basename "$file")
    alters=$(grep -i "ALTER TABLE" "$file" | sed 's/.*ALTER TABLE \([^(]*\).*/\1/i' | sort -u | tr '\n' ', ' | sed 's/,$//')
    if [ -n "$alters" ]; then
        echo "$filename: $alters"
    fi
done | sort
echo

# Check for INSERT statements (data dependencies)
echo "5. Data insertions (INSERT INTO):"
for file in platform/schema/*.sql; do
    filename=$(basename "$file")
    inserts=$(grep -i "INSERT INTO" "$file" | sed 's/.*INSERT INTO \([^(]*\).*/\1/i' | sort -u | tr '\n' ', ' | sed 's/,$//')
    if [ -n "$inserts" ]; then
        echo "$filename: $inserts"
    fi
done | sort
echo

# Check for potential syntax issues
echo "6. Potential syntax issues:"
for file in platform/schema/*.sql; do
    filename=$(basename "$file")
    issues=""
    
    # Check for unclosed quotes
    if grep -q "'" "$file"; then
        quote_count=$(grep -o "'" "$file" | wc -l)
        if [ $((quote_count % 2)) -ne 0 ]; then
            issues="$issues unclosed_quotes"
        fi
    fi
    
    # Check for missing semicolons at end of lines
    if grep -v "^\s*--" "$file" | grep -v "^\s*$" | tail -1 | grep -q "[^;]$" 2>/dev/null; then
        issues="$issues missing_semicolon"
    fi
    
    if [ -n "$issues" ]; then
        echo "$filename: $issues"
    fi
done
echo

echo "=== Validation Complete ==="