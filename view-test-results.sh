#!/bin/bash

# Genshi Studio E2E Test Results Viewer
# Quick access to comprehensive test results

echo "======================================================"
echo "🧪 GENSHI STUDIO E2E TEST RESULTS"
echo "======================================================"

# Check if comprehensive report exists
if [ -f "tests/reports/comprehensive-e2e-test-report.md" ]; then
    echo "📊 Comprehensive Test Report: tests/reports/comprehensive-e2e-test-report.md"
else
    echo "❌ Comprehensive test report not found"
fi

# Check if JSON summary exists
if [ -f "tests/reports/e2e-test-summary.json" ]; then
    echo "📈 Test Summary JSON: tests/reports/e2e-test-summary.json"
    
    # Extract key metrics using jq if available
    if command -v jq &> /dev/null; then
        echo ""
        echo "🔍 KEY METRICS:"
        echo "==============="
        echo "Pass Rate: $(jq -r '.overallResults.passRate' tests/reports/e2e-test-summary.json)% (Required: 90%)"
        echo "Status: $(jq -r '.overallResults.status' tests/reports/e2e-test-summary.json)"
        echo "Meets Requirements: $(jq -r '.overallResults.meetsRequirements' tests/reports/e2e-test-summary.json)"
        echo "Workflow Repetition Required: $(jq -r '.overallResults.workflowRepetitionRequired' tests/reports/e2e-test-summary.json)"
        echo ""
        echo "🚨 CRITICAL ISSUES:"
        echo "==================="
        jq -r '.criticalIssues[] | "- \(.severity): \(.issue)"' tests/reports/e2e-test-summary.json
        echo ""
        echo "📋 IMMEDIATE ACTIONS REQUIRED:"
        echo "=============================="
        jq -r '.recommendations.immediate[] | "- \(.)"' tests/reports/e2e-test-summary.json
    fi
else
    echo "❌ Test summary JSON not found"
fi

echo ""
echo "📂 All Test Files:"
echo "=================="
find tests/ -name "*.md" -o -name "*.json" -o -name "*.xml" | head -10

echo ""
echo "🎯 To view full report:"
echo "cat tests/reports/comprehensive-e2e-test-report.md"

echo ""
echo "======================================================"