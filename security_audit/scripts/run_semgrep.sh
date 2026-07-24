#!/bin/bash
# Semgrep SAST Scanning Script

echo "Running Semgrep SAST..."
semgrep ci --json -o reports/semgrep-results.json
if [ $? -ne 0 ]; then
    echo "Semgrep found critical vulnerabilities!"
    exit 1
fi
echo "Semgrep scan completed successfully."
