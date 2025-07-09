#!/bin/bash
#
# Genshi Studio E2E Test Runner
# Executes comprehensive E2E tests with reporting
#

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/Users/homeserver/ai-creative-team/projects/genshi-studio"
TEST_DIR="$PROJECT_DIR/tests/e2e"
RESULTS_DIR="$PROJECT_DIR/tests/results"
REPORTS_DIR="$PROJECT_DIR/tests/reports"

echo -e "${BLUE}🧪 Genshi Studio E2E Test Runner${NC}"
echo "=================================="

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    # Check if project directory exists
    if [ ! -d "$PROJECT_DIR" ]; then
        echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
        exit 1
    fi
    
    # Check if node_modules exists
    if [ ! -d "$PROJECT_DIR/node_modules" ]; then
        echo -e "${YELLOW}📦 Installing dependencies...${NC}"
        cd "$PROJECT_DIR"
        npm install
    fi
    
    # Install Playwright browsers if not already installed
    if [ ! -d "$PROJECT_DIR/node_modules/.cache/ms-playwright" ]; then
        echo -e "${YELLOW}🌐 Installing Playwright browsers...${NC}"
        cd "$PROJECT_DIR"
        npx playwright install
    fi
    
    echo -e "${GREEN}✅ Prerequisites check complete${NC}"
}

# Function to create directories
create_directories() {
    echo -e "${YELLOW}Creating test directories...${NC}"
    mkdir -p "$TEST_DIR"/{specs,pages,fixtures,helpers}
    mkdir -p "$RESULTS_DIR"
    mkdir -p "$REPORTS_DIR"/{html,json}
    mkdir -p "$PROJECT_DIR/tests/screenshots"
    echo -e "${GREEN}✅ Directories created${NC}"
}

# Function to run tests
run_tests() {
    cd "$PROJECT_DIR"
    
    # Parse command line arguments
    TEST_SUITE=$1
    BROWSER=$2
    
    echo -e "${BLUE}Starting E2E tests...${NC}"
    echo "Test Suite: ${TEST_SUITE:-all}"
    echo "Browser: ${BROWSER:-all}"
    
    # Build test command
    TEST_CMD="npx playwright test"
    
    # Add specific test suite if provided
    if [ -n "$TEST_SUITE" ]; then
        case $TEST_SUITE in
            "loading")
                TEST_CMD="$TEST_CMD tests/e2e/specs/01-app-loading.spec.ts"
                ;;
            "drawing")
                TEST_CMD="$TEST_CMD tests/e2e/specs/02-drawing-tools.spec.ts"
                ;;
            "patterns")
                TEST_CMD="$TEST_CMD tests/e2e/specs/03-cultural-patterns.spec.ts"
                ;;
            "performance")
                TEST_CMD="$TEST_CMD tests/e2e/specs/04-performance.spec.ts"
                ;;
            "accessibility")
                TEST_CMD="$TEST_CMD tests/e2e/specs/05-accessibility.spec.ts"
                ;;
            "visual")
                TEST_CMD="$TEST_CMD tests/e2e/specs/06-visual-regression.spec.ts"
                ;;
            "all")
                # Run all tests
                ;;
            *)
                echo -e "${RED}❌ Unknown test suite: $TEST_SUITE${NC}"
                echo "Available suites: loading, drawing, patterns, performance, accessibility, visual, all"
                exit 1
                ;;
        esac
    fi
    
    # Add browser project if specified
    if [ -n "$BROWSER" ] && [ "$BROWSER" != "all" ]; then
        TEST_CMD="$TEST_CMD --project=$BROWSER"
    fi
    
    # Run tests
    echo -e "${YELLOW}Executing: $TEST_CMD${NC}"
    $TEST_CMD
    
    TEST_EXIT_CODE=$?
    
    # Generate summary report
    generate_summary_report $TEST_EXIT_CODE
    
    return $TEST_EXIT_CODE
}

# Function to generate summary report
generate_summary_report() {
    EXIT_CODE=$1
    REPORT_FILE="$REPORTS_DIR/e2e-test-summary.txt"
    
    echo -e "\n${BLUE}Test Execution Summary${NC}"
    echo "======================"
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
    else
        echo -e "${RED}❌ Some tests failed${NC}"
    fi
    
    # Count test results
    if [ -f "$REPORTS_DIR/json/results.json" ]; then
        TOTAL=$(jq '.suites | length' "$REPORTS_DIR/json/results.json" 2>/dev/null || echo "0")
        PASSED=$(jq '[.suites[].specs[] | select(.ok == true)] | length' "$REPORTS_DIR/json/results.json" 2>/dev/null || echo "0")
        FAILED=$(jq '[.suites[].specs[] | select(.ok == false)] | length' "$REPORTS_DIR/json/results.json" 2>/dev/null || echo "0")
        
        echo "Total Tests: $TOTAL"
        echo "Passed: $PASSED"
        echo "Failed: $FAILED"
        
        if [ "$TOTAL" -gt 0 ]; then
            PASS_RATE=$((PASSED * 100 / TOTAL))
            echo "Pass Rate: ${PASS_RATE}%"
            
            if [ $PASS_RATE -ge 90 ]; then
                echo -e "${GREEN}✅ Achieved 90%+ pass rate requirement!${NC}"
            else
                echo -e "${RED}❌ Below 90% pass rate requirement${NC}"
            fi
        fi
    fi
    
    # Save summary to file
    {
        echo "E2E Test Summary - $(date)"
        echo "========================"
        echo "Exit Code: $EXIT_CODE"
        echo "Total Tests: ${TOTAL:-0}"
        echo "Passed: ${PASSED:-0}"
        echo "Failed: ${FAILED:-0}"
        echo "Pass Rate: ${PASS_RATE:-0}%"
    } > "$REPORT_FILE"
    
    echo -e "\nReports available at:"
    echo "- HTML: $REPORTS_DIR/html/index.html"
    echo "- JSON: $REPORTS_DIR/json/results.json"
    echo "- Summary: $REPORT_FILE"
}

# Function to open reports
open_reports() {
    if [ -f "$REPORTS_DIR/html/index.html" ]; then
        echo -e "${BLUE}Opening HTML report...${NC}"
        open "$REPORTS_DIR/html/index.html" 2>/dev/null || xdg-open "$REPORTS_DIR/html/index.html" 2>/dev/null
    fi
}

# Main execution
main() {
    echo "Starting at: $(date)"
    
    check_prerequisites
    create_directories
    
    # Run tests
    run_tests "$@"
    TEST_RESULT=$?
    
    # Open reports if tests completed
    if [ "$3" == "--open" ]; then
        open_reports
    fi
    
    echo -e "\nCompleted at: $(date)"
    
    exit $TEST_RESULT
}

# Show help
show_help() {
    echo "Usage: $0 [test-suite] [browser] [--open]"
    echo ""
    echo "Test Suites:"
    echo "  loading       - Application loading and initialization tests"
    echo "  drawing       - Drawing tools and graphics tests"
    echo "  patterns      - Cultural pattern generation tests"
    echo "  performance   - Performance and optimization tests"
    echo "  accessibility - Accessibility and WCAG compliance tests"
    echo "  visual        - Visual regression tests"
    echo "  all           - Run all test suites (default)"
    echo ""
    echo "Browsers:"
    echo "  chromium      - Run tests in Chromium"
    echo "  firefox       - Run tests in Firefox"
    echo "  webkit        - Run tests in WebKit/Safari"
    echo "  all           - Run tests in all browsers (default)"
    echo ""
    echo "Options:"
    echo "  --open        - Open HTML report after tests complete"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests in all browsers"
    echo "  $0 drawing            # Run drawing tests in all browsers"
    echo "  $0 all chromium       # Run all tests in Chromium only"
    echo "  $0 performance firefox --open  # Run performance tests in Firefox and open report"
}

# Handle help flag
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    show_help
    exit 0
fi

# Run main function
main "$@"