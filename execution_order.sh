#!/bin/bash

# Schema Execution Order Validator
echo "=== Recommended Execution Order ==="
echo

# List all schema files in numerical order
echo "Core Schema (must run first):"
ls platform/schema/001_*.sql platform/schema/002_*.sql platform/schema/003_*.sql
echo

echo "Extensions & Features:"
ls platform/schema/004_*.sql platform/schema/005_*.sql platform/schema/006_*.sql platform/schema/007_*.sql platform/schema/008_*.sql
echo

echo "Data & Coverage:"
ls platform/schema/009_*.sql platform/schema/010_*.sql platform/schema/011_*.sql platform/schema/012_*.sql platform/schema/013_*.sql platform/schema/014_*.sql
echo

echo "Advanced Features:"
ls platform/schema/015_*.sql platform/schema/016_*.sql platform/schema/017_*.sql platform/schema/018_*.sql platform/schema/019_*.sql
echo

echo "Recent Features:"
ls platform/schema/020_*.sql platform/schema/021_*.sql platform/schema/022_*.sql platform/schema/023_*.sql
echo

echo "Migration Fixes:"
ls platform/schema/024_*.sql platform/schema/025_*.sql platform/schema/026_*.sql platform/schema/027_*.sql platform/schema/028_*.sql platform/schema/029_*.sql
echo

echo "=== Critical Dependencies ==="
echo "1. 001_initial_schema.sql must run first (creates users, alerts, audit_logs)"
echo "2. 003_extended_schema.sql depends on 001 (adds spatial tables)"
echo "3. 005_simulation_data.sql depends on 001, 003, 004 (needs users, tables, roles)"
echo "4. 010_test_agencies.sql depends on 007 (needs agencies table)"
echo "5. 029_recovery_schema.sql fixes missing table from 005"
echo

echo "=== Execution Command ==="
echo "Run in order:"
echo "for file in 001_*.sql 002_*.sql 003_*.sql 004_*.sql 005_*.sql 006_*.sql 007_*.sql 008_*.sql 009_*.sql 010_*.sql 011_*.sql 012_*.sql 013_*.sql 014_*.sql 015_*.sql 016_*.sql 017_*.sql 018_*.sql 019_*.sql 020_*.sql 021_*.sql 022_*.sql 023_*.sql 024_*.sql 025_*.sql 026_*.sql 027_*.sql 028_*.sql 029_*.sql; do"
echo "    echo \"Running \$file...\""
echo "    psql -d your_database < \$file"
echo "done"