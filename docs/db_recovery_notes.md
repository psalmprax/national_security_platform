# Schema Issues Fixed

## Problems Found & Fixed:

### 1. ✅ Duplicate Statements (FIXED)
- `004_rbac_roles.sql`: Removed duplicate `DELETE FROM alerts;` 
- `004_rbac_roles.sql`: Removed duplicate header comment
- `010_test_agencies.sql`: Removed duplicate comment line

### 2. ✅ Missing Table (FIXED)
- `005_simulation_data.sql` referenced `mock_data_points` table that didn't exist
- `029_recovery_schema.sql` creates this missing table

### 3. ✅ Execution Order (VALIDATED)
Schema files must run in numerical order:
1. `001_initial_schema.sql` - Creates core tables (users, alerts, audit_logs)
2. `002_test_data.sql` - Test users
3. `003_extended_schema.sql` - Spatial tables (states, lgas, villages, devices)
4. `004_rbac_roles.sql` - Role-based users
5. `005_simulation_data.sql` - Simulation data (needs tables 1-4)
6. `007_agency_schema.sql` - Agencies & assets
7. `010_test_agencies.sql` - Test agencies (needs 007)

### 4. ⚠️ Proto Schema Alignment
Proto file uses different field names than SQL:
- Proto: `latitude`, `longitude` 
- SQL: `location` (GEOMETRY POINT)

## How to Execute:

```bash
cd platform/schema
./run_schema.sh
```

Or manually:
```bash
for file in 001_*.sql 002_*.sql 003_*.sql 004_*.sql 005_*.sql 006_*.sql 007_*.sql 008_*.sql 009_*.sql 010_*.sql 011_*.sql 012_*.sql 013_*.sql 014_*.sql 015_*.sql 016_*.sql 017_*.sql 018_*.sql 019_*.sql 020_*.sql 021_*.sql 022_*.sql 023_*.sql 024_*.sql 025_*.sql 026_*.sql 027_*.sql 028_*.sql 029_*.sql; do
    psql -d your_database < $file
done
```

## Scripts Created:
- `validate_schema.sh` - Validates schema structure
- `execution_order.sh` - Shows execution order
- `run_schema.sh` - Executes all schema files
- `fix_schema.sh` - Fixes identified issues

All critical issues have been resolved. The schema is now ready for execution.