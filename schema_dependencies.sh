#!/bin/bash

# Schema Dependency Graph Generator
# Creates a dependency graph showing execution order

echo "digraph SchemaDependencies {"
echo "    rankdir=TB;"
echo "    node [shape=box, style=rounded];"

# Extract tables and their dependencies
echo "    // Tables created"
for file in platform/schema/*.sql; do
    filename=$(basename "$file" .sql)
    tables=$(grep -i "CREATE TABLE IF NOT EXISTS" "$file" | sed 's/.*CREATE TABLE IF NOT EXISTS \([^(]*\).*/\1/i' | tr '[:upper:]' '[:lower:]')
    
    for table in $tables; do
        echo "    \"$table\" [label=\"$table\\n($filename)\"];"
    done
done

echo
echo "    // Dependencies (INSERT INTO requires table to exist)"

# Check INSERT dependencies
for file in platform/schema/*.sql; do
    filename=$(basename "$file" .sql)
    inserts=$(grep -i "INSERT INTO" "$file" | sed 's/.*INSERT INTO \([^(]*\).*/\1/i' | tr '[:upper:]' '[:lower:]')
    
    for target_table in $inserts; do
        # Find which file created this table
        for create_file in platform/schema/*.sql; do
            create_filename=$(basename "$create_file" .sql)
            tables=$(grep -i "CREATE TABLE IF NOT EXISTS" "$create_file" | sed 's/.*CREATE TABLE IF NOT EXISTS \([^(]*\).*/\1/i' | tr '[:upper:]' '[:lower:]')
            
            if echo "$tables" | grep -q "^$target_table$"; then
                if [ "$filename" != "$create_filename" ]; then
                    echo "    \"$create_filename\" -> \"$filename\" [label=\"inserts into $target_table\", style=dashed, color=blue];"
                fi
                break
            fi
        done
    done
done

echo
echo "    // Foreign Key Dependencies"

# Check foreign key dependencies
for file in platform/schema/*.sql; do
    filename=$(basename "$file" .sql)
    
    # Find tables with REFERENCES
    grep -i "REFERENCES" "$file" | while read line; do
        table=$(echo "$line" | sed 's/.*CREATE TABLE IF NOT EXISTS \([^(]*\).*/\1/i' | tr '[:upper:]' '[:lower:]')
        ref_table=$(echo "$line" | sed 's/.*REFERENCES \([^(]*\).*/\1/i' | tr '[:upper:]' '[:lower:]')
        
        # Find which file created the referenced table
        for create_file in platform/schema/*.sql; do
            create_filename=$(basename "$create_file" .sql)
            tables=$(grep -i "CREATE TABLE IF NOT EXISTS" "$create_file" | sed 's/.*CREATE TABLE IF NOT EXISTS \([^(]*\).*/\1/i' | tr '[:upper:]' '[:lower:]')
            
            if echo "$tables" | grep -q "^$ref_table$"; then
                if [ "$filename" != "$create_filename" ]; then
                    echo "    \"$create_filename\" -> \"$filename\" [label=\"FK: $table -> $ref_table\", color=red];"
                fi
                break
            fi
        done
    done
done

echo "}"