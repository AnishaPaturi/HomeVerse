#!/usr/bin/env python3
"""
HomeVerse Automated Smoke Test Suite (Phase 36)
Validates core service availability and API endpoints post-deployment.
Usage: python scripts/smoke_test.py [BASE_URL]
"""
import sys
import time
import urllib.request
import urllib.error
import json

DEFAULT_URL = "http://localhost:8080"

def run_smoke_tests(base_url: str) -> bool:
    print(f"======================================================")
    print(f" HomeVerse Post-Deployment Smoke Tests (Phase 36)")
    print(f" Target Endpoint: {base_url}")
    print(f"======================================================")

    endpoints = [
        {"path": "/health", "expected_status": 200, "desc": "Service Health Probe"},
        {"path": "/", "expected_status": 200, "desc": "API Root Welcome Endpoint"},
        {"path": "/api/preferences/reference-images", "expected_status": 200, "desc": "Preference Discovery Catalog"},
        {"path": "/api/ai/what-if/presets", "expected_status": 200, "desc": "What-If Simulation Engine"},
    ]

    all_passed = True

    for ep in endpoints:
        url = f"{base_url.rstrip('/')}{ep['path']}"
        print(f"\n--> Testing {ep['desc']} ({url})...")
        start = time.time()
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "HomeVerse-SmokeTest/1.0", "Accept": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                status_code = response.getcode()
                elapsed = round((time.time() - start) * 1000, 2)
                body = response.read().decode("utf-8")

                if status_code == ep["expected_status"]:
                    print(f"    [PASS] HTTP {status_code} ({elapsed}ms)")
                else:
                    print(f"    [FAIL] Expected HTTP {ep['expected_status']}, got {status_code}")
                    all_passed = False
        except urllib.error.HTTPError as e:
            elapsed = round((time.time() - start) * 1000, 2)
            if e.code == ep["expected_status"]:
                print(f"    [PASS] HTTP {e.code} ({elapsed}ms)")
            else:
                print(f"    [FAIL] HTTP Error: {e.code} {e.reason} ({elapsed}ms)")
                all_passed = False
        except Exception as e:
            print(f"    [FAIL] Connection Error: {e}")
            all_passed = False

    print("\n======================================================")
    if all_passed:
        print(" All smoke tests PASSED successfully!")
        print("======================================================")
        return True
    else:
        print(" Smoke tests FAILED! Deployment may be unstable.")
        print("======================================================")
        return False

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    success = run_smoke_tests(target)
    sys.exit(0 if success else 1)
