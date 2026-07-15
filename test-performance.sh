#!/bin/bash

# Performance Test Script for KPI Dashboard
# Tests API response times and verifies data accuracy

API_URL="http://localhost:3008"

echo "═══════════════════════════════════════════════════════"
echo "  KPI DASHBOARD PERFORMANCE TEST"
echo "═══════════════════════════════════════════════════════"
echo ""

# Test 1: Unified Dashboard API (First Request - Cold Cache)
echo "📊 TEST 1: Unified Dashboard API (Cold Cache)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
START=$(date +%s%N)
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME_TOTAL:%{time_total}" "${API_URL}/api/dashboard")
END=$(date +%s%N)
DURATION=$(echo "scale=3; ($END - $START) / 1000000000" | bc)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
TIME_CURL=$(echo "$RESPONSE" | grep "TIME_TOTAL" | cut -d: -f2)

echo "Status Code: $HTTP_CODE"
echo "Response Time: ${TIME_CURL}s"
echo "Total Duration: ${DURATION}s"
echo ""

# Extract data counts
DATA=$(echo "$RESPONSE" | grep -v "HTTP_CODE\|TIME_TOTAL")
KPI_COUNT=$(echo "$DATA" | grep -o '"id":"rec[^"]*"' | head -20 | wc -l)
echo "✅ KPIs found: $KPI_COUNT"
echo ""

# Test 2: Cached Request
sleep 1
echo "📊 TEST 2: Unified Dashboard API (Warm Cache)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
START=$(date +%s%N)
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME_TOTAL:%{time_total}" "${API_URL}/api/dashboard")
END=$(date +%s%N)
DURATION=$(echo "scale=3; ($END - $START) / 1000000000" | bc)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
TIME_CURL=$(echo "$RESPONSE" | grep "TIME_TOTAL" | cut -d: -f2)

echo "Status Code: $HTTP_CODE"
echo "Response Time: ${TIME_CURL}s (CACHED)"
echo "Total Duration: ${DURATION}s"
echo ""

# Test 3: Multiple Rapid Requests
echo "📊 TEST 3: Burst Test (5 requests)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL_TIME=0
for i in {1..5}; do
    START=$(date +%s%N)
    curl -s "${API_URL}/api/dashboard" > /dev/null
    END=$(date +%s%N)
    DURATION=$(echo "scale=3; ($END - $START) / 1000000000" | bc)
    echo "Request $i: ${DURATION}s"
    TOTAL_TIME=$(echo "$TOTAL_TIME + $DURATION" | bc)
done
AVG_TIME=$(echo "scale=3; $TOTAL_TIME / 5" | bc)
echo "Average: ${AVG_TIME}s"
echo ""

# Test 4: Verify Data Accuracy
echo "📊 TEST 4: Data Accuracy Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s "${API_URL}/api/dashboard")

# Check for "Monthly Sales Target"
if echo "$RESPONSE" | grep -q "Monthly Sales Target"; then
    echo "✅ Monthly Sales Target found"

    # Extract the full KPI object
    KPI_DATA=$(echo "$RESPONSE" | grep -A 10 "Monthly Sales Target")

    if echo "$KPI_DATA" | grep -q '"status":"in-progress"'; then
        echo "✅ Status correctly mapped to 'in-progress'"
    else
        echo "❌ Status mapping incorrect"
    fi

    if echo "$KPI_DATA" | grep -q '"targetValue":100'; then
        echo "✅ Target value correct (100)"
    fi

    if echo "$KPI_DATA" | grep -q '"actualValue":92'; then
        echo "✅ Actual value correct (92)"
    fi
else
    echo "❌ Monthly Sales Target not found"
fi
echo ""

# Test 5: Individual Endpoints (Legacy)
echo "📊 TEST 5: Individual Endpoints (for comparison)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for endpoint in "kpis" "employees" "departments" "tasks" "achievements"; do
    START=$(date +%s%N)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/${endpoint}")
    END=$(date +%s%N)
    DURATION=$(echo "scale=3; ($END - $START) / 1000000000" | bc)
    echo "/api/${endpoint}: ${DURATION}s (Status: $HTTP_CODE)"
done

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ PERFORMANCE TEST COMPLETE"
echo "═══════════════════════════════════════════════════════"
