#!/bin/bash
# Trivy Dependency Scanning Script

echo "Running Trivy Vulnerability Scanner..."
trivy fs . --format json -o reports/trivy-results.json --exit-code 1 --severity CRITICAL,HIGH
if [ $? -ne 0 ]; then
    echo "Trivy found critical or high severity vulnerabilities!"
    exit 1
fi
echo "Trivy scan completed successfully."
