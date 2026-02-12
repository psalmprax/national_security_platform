#!/bin/bash

# Implementation Validation Script
# Run this after implementing each phase

echo "=== National Security Platform Implementation Validation ==="
echo

# Function to check if a feature is implemented
check_implementation() {
    local feature=$1
    local check_command=$2
    
    echo "Checking $feature..."
    if eval "$check_command"; then
        echo "✅ $feature: IMPLEMENTED"
        return 0
    else
        echo "❌ $feature: NOT IMPLEMENTED"
        return 1
    fi
}

# Function to update progress in gap analysis
update_progress() {
    local section=$1
    local status=$2
    
    echo "Updating progress for $section: $status"
    # This would update the markdown file
    sed -i "s/^\[$section\].*/\[$section\] $status/" docs/production_readiness_gap_analysis.md
}

echo "1. Testing Framework Validation"
echo "================================"

# Check for test files
test_files_exist=$(find . -name "*_test.go" -o -name "test_*.py" -o -name "*.test.tsx" -o -name "*.test.js" | wc -l)
if [ $test_files_exist -gt 0 ]; then
    echo "✅ Test files found: $test_files_exist test files"
    update_progress "testing" "✅ IMPLEMENTED"
else
    echo "❌ No test files found"
    update_progress "testing" "❌ NOT IMPLEMENTED"
fi

# Check for test frameworks
go_test_exists=$(go list -m github.com/stretchr/testify/assert 2>/dev/null | wc -l)
pytest_exists=$(pip list | grep pytest | wc -l)
jest_exists=$(cd web && npm list jest 2>/dev/null | wc -l)

echo "Go test framework: $([ $go_test_exists -gt 0 ] && echo '✅' || echo '❌')"
echo "Python test framework: $([ $pytest_exists -gt 0 ] && echo '✅' || echo '❌')"
echo "JavaScript test framework: $([ $jest_exists -gt 0 ] && echo '✅' || echo '❌')"

echo
echo "2. CI/CD Pipeline Validation"
echo "============================"

# Check for GitHub Actions
github_actions_exist=$(find .github -name "*.yml" 2>/dev/null | wc -l)
if [ $github_actions_exist -gt 0 ]; then
    echo "✅ GitHub Actions found: $github_actions_exist workflows"
    update_progress "cicd" "✅ IMPLEMENTED"
else
    echo "❌ No GitHub Actions found"
    update_progress "cicd" "❌ NOT IMPLEMENTED"
fi

# Check for pre-commit hooks
precommit_exists=$(ls .pre-commit-config.yaml 2>/dev/null | wc -l)
echo "Pre-commit hooks: $([ $precommit_exists -gt 0 ] && echo '✅' || echo '❌')"

echo
echo "3. Monitoring & Alerting Validation"
echo "===================================="

# Check if monitoring services are running
prometheus_running=$(docker ps --filter "name=prometheus" --format "table {{.Names}}" | wc -l)
grafana_running=$(docker ps --filter "name=grafana" --format "table {{.Names}}" | wc -l)

echo "Prometheus: $([ $prometheus_running -gt 1 ] && echo '✅ Running' || echo '❌ Not running')"
echo "Grafana: $([ $grafana_running -gt 1 ] && echo '✅ Running' || echo '❌ Not running')"

if [ $prometheus_running -gt 1 ] && [ $grafana_running -gt 1 ]; then
    update_progress "monitoring" "✅ IMPLEMENTED"
else
    update_progress "monitoring" "❌ NOT IMPLEMENTED"
fi

echo
echo "4. Security Scanning Validation"
echo "==============================="

# Check for security tools
gosec_exists=$(which gosec 2>/dev/null | wc -l)
bandit_exists=$(which bandit 2>/dev/null | wc -l)
trivy_exists=$(which trivy 2>/dev/null | wc -l)

echo "Go security scanner (gosec): $([ $gosec_exists -gt 0 ] && echo '✅' || echo '❌')"
echo "Python security scanner (bandit): $([ $bandit_exists -gt 0 ] && echo '✅' || echo '❌')"
echo "Container scanner (trivy): $([ $trivy_exists -gt 0 ] && echo '✅' || echo '❌')"

if [ $gosec_exists -gt 0 ] && [ $bandit_exists -gt 0 ] && [ $trivy_exists -gt 0 ]; then
    update_progress "security" "✅ IMPLEMENTED"
else
    update_progress "security" "❌ NOT IMPLEMENTED"
fi

echo
echo "5. Backup Strategy Validation"
echo "============================"

# Check for backup scripts
backup_scripts_exist=$(ls scripts/backup_*.sh 2>/dev/null | wc -l)
restore_scripts_exist=$(ls scripts/restore_*.sh 2>/dev/null | wc -l)

echo "Backup scripts: $([ $backup_scripts_exist -gt 0 ] && echo '✅ Found' || echo '❌ Not found')"
echo "Restore scripts: $([ $restore_scripts_exist -gt 0 ] && echo '✅ Found' || echo '❌ Not found')"

if [ $backup_scripts_exist -gt 0 ] && [ $restore_scripts_exist -gt 0 ]; then
    update_progress "backup" "✅ IMPLEMENTED"
else
    update_progress "backup" "❌ NOT IMPLEMENTED"
fi

echo
echo "6. Overall Progress Summary"
echo "=========================="

# Count implemented features
implemented_count=0
total_count=5

if [ $test_files_exist -gt 0 ]; then implemented_count=$((implemented_count + 1)); fi
if [ $github_actions_exist -gt 0 ]; then implemented_count=$((implemented_count + 1)); fi
if [ $prometheus_running -gt 1 ] && [ $grafana_running -gt 1 ]; then implemented_count=$((implemented_count + 1)); fi
if [ $gosec_exists -gt 0 ] && [ $bandit_exists -gt 0 ] && [ $trivy_exists -gt 0 ]; then implemented_count=$((implemented_count + 1)); fi
if [ $backup_scripts_exist -gt 0 ] && [ $restore_scripts_exist -gt 0 ]; then implemented_count=$((implemented_count + 1)); fi

progress_percentage=$((implemented_count * 100 / total_count))

echo "Progress: $implemented_count/$total_count features implemented ($progress_percentage%)"

if [ $progress_percentage -eq 100 ]; then
    echo "🎉 All Phase 1 critical features implemented!"
elif [ $progress_percentage -ge 60 ]; then
    echo "📈 Good progress! Continue with remaining features."
else
    echo "⚠️  Need more work on Phase 1 features."
fi

echo
echo "Next Steps:"
if [ $test_files_exist -eq 0 ]; then
    echo "- Implement automated testing framework"
fi
if [ $github_actions_exist -eq 0 ]; then
    echo "- Set up CI/CD pipeline"
fi
if [ $prometheus_running -le 1 ] || [ $grafana_running -le 1 ]; then
    echo "- Deploy monitoring and alerting"
fi
if [ $gosec_exists -eq 0 ] || [ $bandit_exists -eq 0 ] || [ $trivy_exists -eq 0 ]; then
    echo "- Implement security scanning"
fi
if [ $backup_scripts_exist -eq 0 ] || [ $restore_scripts_exist -eq 0 ]; then
    echo "- Set up backup strategy"
fi

echo
echo "Run this script again after implementing each feature to track progress."