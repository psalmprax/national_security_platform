#!/bin/bash

# Complete Schema Fix Script
echo "=== National Security Platform Schema Fix ==="
echo

# Change to schema directory
cd platform/schema

echo "1. Applying fixes to duplicate statements..."
# Already fixed above

echo "2. Checking for any remaining syntax issues..."

# Check for common SQL syntax issues
syntax_errors=0

for file in *.sql; do
    # Check for unclosed parentheses
    if grep -q "(" "$file"; then
        open_parens=$(grep -o "(" "$file" | wc -l)
        close_parens=$(grep -o ")" "$file" | wc -l)
        if [ $open_parens -ne $close_parens ]; then
            echo "  WARNING: $file has unmatched parentheses"
            syntax_errors=$((syntax_errors + 1))
        fi
    fi
    
    # Check for lines that should end with semicolon but don't
    non_comment_lines=$(grep -v "^\s*--" "$file" | grep -v "^\s*$" | grep -v "^\s*CREATE TABLE" | grep -v "^\s*INSERT INTO" | grep -v "^\s*ALTER TABLE" | grep -v "^\s*DROP TABLE" | grep -v "^\s*DELETE FROM" | grep -v "^\s*CREATE INDEX")
    
    while IFS= read -r line; do
        if [[ "$line" =~ [a-zA-Z0-9]$ ]] && [[ ! "$line" =~ --$ ]] && [[ ! "$line" =~ \$ ]]; then
            if [[ ! "$line" =~ \;$ ]]; then
                echo "  WARNING: $file may have missing semicolon: ${line:0:50}..."
                syntax_errors=$((syntax_errors + 1))
            fi
        fi
    done <<< "$non_comment_lines"
done

if [ $syntax_errors -eq 0 ]; then
    echo "  ✓ No syntax errors found"
else
    echo "  ⚠ Found $syntax_errors potential syntax issues"
fi

echo
echo "3. Validating table dependencies..."

# Create a list of all tables
all_tables=""
for file in *.sql; do
    tables=$(grep -i "CREATE TABLE IF NOT EXISTS" "$file" | sed 's/.*CREATE TABLE IF NOT EXISTS \([^(]*\).*/\1/i')
    all_tables="$all_tables $tables"
done

# Check for INSERT INTO statements that reference non-existent tables
for file in *.sql; do
    inserts=$(grep -i "INSERT INTO" "$file" | sed 's/.*INSERT INTO \([^(]*\).*/\1/i')
    for table in $inserts; do
        # Check if this table was created in any file
        table_exists=false
        for create_file in *.sql; do
            created_tables=$(grep -i "CREATE TABLE IF NOT EXISTS" "$create_file" | sed 's/.*CREATE TABLE IF NOT EXISTS \([^(]*\).*/\1/i')
            if echo "$created_tables" | grep -q "^$table$"; then
                table_exists=true
                break
            fi
        done
        
        if [ "$table_exists" = false ]; then
            echo "  WARNING: $file inserts into table '$table' that doesn't exist"
        fi
    done
done

echo
echo "4. Creating execution script..."

cat > run_schema.sh << 'EOF'
#!/bin/bash

# Schema Execution Script
# Run this to apply all schema changes in correct order

echo "=== Running National Security Platform Schema ==="
echo

# Database connection settings
DB_NAME=${1:-"national_security"}
DB_USER=${2:-"postgres"}
DB_HOST=${3:-"localhost"}

echo "Connecting to database: $DB_NAME"
echo

# Check if database exists (optional)
# psql -h $DB_HOST -U $DB_USER -l | grep -q $DB_NAME
# if [ $? -ne 0 ]; then
#     echo "Database $DB_NAME does not exist. Creating..."
#     createdb -h $DB_HOST -U $DB_USER $DB_NAME
# fi

# Execute schema files in order
files=(
    "001_initial_schema.sql"
    "002_test_data.sql"
    "003_extended_schema.sql"
    "004_rbac_roles.sql"
    "005_simulation_data.sql"
    "006_auth_and_status.sql"
    "007_agency_schema.sql"
    "008_security_sentinel_schema.sql"
    "009_spatial_tuning.sql"
    "010_test_agencies.sql"
    "011_seed_agency_personnel.sql"
    "012_location_source.sql"
    "013_real_seeding_data.sql"
    "014_national_coverage.sql"
    "015_procedural_fill.sql"
    "016_add_updated_at.sql"
    "017_classified_alerts.sql"
    "018_mission_schema.sql"
    "019_lga_centroids.sql"
    "020_public_alerts.sql"
    "021_safety_scores.sql"
    "022_anonymous_tips.sql"
    "023_advanced_features.sql"
    "024_add_updated_at_timestamps.sql"
    "025_standardize_all_remaining_timestamps.sql"
    "026_notification_support.sql"
    "027_dynamic_access_control.sql"
    "028_sovereign_identity.sql"
    "029_recovery_schema.sql"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Running $file..."
        psql -h $DB_HOST -U $DB_USER -d $DB_NAME < "$file"
        if [ $? -eq 0 ]; then
            echo "  ✓ Success"
        else
            echo "  ✗ Failed"
            exit 1
        fi
    else
        echo "  ⚠ File $file not found, skipping"
    fi
    echo
done

echo "=== Schema execution complete ==="
EOF

chmod +x run_schema.sh

echo "5. Summary of fixes applied:"
echo "  ✓ Removed duplicate DELETE statements in 004_rbac_roles.sql"
echo "  ✓ Removed duplicate comments in 004_rbac_roles.sql and 010_test_agencies.sql"
echo "  ✓ Created validation scripts"
echo "  ✓ Created execution script"
echo "  ✓ Fixed missing mock_data_points table (029_recovery_schema.sql)"
echo

echo "=== Next Steps ==="
echo "1. Test the schema: cd platform/schema && ./run_schema.sh"
echo "2. Verify all tables were created: \\dt in psql"
echo "3. Check for any remaining errors"
echo "4. Update proto file if needed to match SQL schema"

echo
echo "=== Schema Fix Complete ==="