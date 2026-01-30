import requests
import time
import schedule
import os
import logging
import json
import psycopg2
from psycopg2.extras import Json

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - SECURITY_SENTINEL - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

TARGET_URL = os.getenv("CORE_API_URL", "http://core-api:8080")
DATABASE_URL = os.getenv("DATABASE_URL")

ENDPOINTS_TO_SCAN = [
    {"path": "/", "expected_status": 200, "protected": False},
    {"path": "/health", "expected_status": 200, "protected": False},
    {"path": "/api/v1/system/status", "expected_status": 401, "protected": True},
    {"path": "/api/v1/system/nodes", "expected_status": 401, "protected": True},
    {"path": "/api/v1/alerts", "expected_status": 401, "protected": True},
    {"path": "/api/v1/agencies", "expected_status": 405, "protected": True},
    {"path": "/api/v1/assets", "expected_status": 401, "protected": True},
]

REQUIRED_HEADERS = [
    "Strict-Transport-Security",
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "X-XSS-Protection"
]

def persist_results(status, findings):
    if not DATABASE_URL:
        logger.warning("⚠️ DATABASE_URL not set. Skipping persistence.")
        return

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        query = """
            INSERT INTO security_scans (target_service, status, findings, meta_data)
            VALUES (%s, %s, %s, %s)
        """
        meta_data = {
            "scanner": "Python Security Sentinel v1.0",
            "target": TARGET_URL,
            "endpoint_count": len(ENDPOINTS_TO_SCAN)
        }
        
        cur.execute(query, ("core-api", status, Json(findings), Json(meta_data)))
        conn.commit()
        cur.close()
        conn.close()
        logger.info("💾 Scan results successfully persisted to database.")
    except Exception as e:
        logger.error(f"❌ Failed to persist results to database: {e}")

def perform_scan():
    logger.info("🛡️ Starting automated security scan...")
    findings = []
    
    for ep in ENDPOINTS_TO_SCAN:
        full_url = f"{TARGET_URL}{ep['path']}"
        try:
            # Perform GET request
            response = requests.get(full_url, timeout=5)
            
            # 1. Check Auth Regressions
            if ep['protected'] and response.status_code == 200:
                msg = f"❌ REGRESSION: Protected endpoint {ep['path']} is accessible without authentication!"
                logger.error(msg)
                findings.append({"type": "REGRESSION", "path": ep['path'], "message": msg})
            elif response.status_code != ep['expected_status']:
                logger.warning(f"⚠️ Unexpected status for {ep['path']}: {response.status_code} (Expected {ep['expected_status']})")

            # 2. Check Security Headers
            for header in REQUIRED_HEADERS:
                if header not in response.headers:
                    msg = f"❌ MISSING HEADER: {header} missing on {ep['path']}"
                    logger.error(msg)
                    findings.append({"type": "MISSING_HEADER", "path": ep['path'], "header": header, "message": msg})

            # 3. Check CORS Policy
            cors_origin = response.headers.get("Access-Control-Allow-Origin")
            if cors_origin == "*":
                msg = f"❌ PERMISSIVE CORS: Access-Control-Allow-Origin is set to '*' on {ep['path']}!"
                logger.error(msg)
                findings.append({"type": "PERMISSIVE_CORS", "path": ep['path'], "message": msg})

        except requests.exceptions.RequestException as e:
            logger.error(f"🔌 Connection Error: Could not reach {full_url}: {e}")
            findings.append({"type": "CONNECTION_ERROR", "path": ep['path'], "error": str(e)})

    status = "PASSED" if not findings else "FAILED"
    if status == "PASSED":
        logger.info("✅ Scan complete: No security regressions or vulnerabilities detected. GuardDog is active.")
    else:
        logger.error(f"🚨 Scan complete: Found {len(findings)} security issues!")
    
    persist_results(status, findings)

def run_scheduler():
    # Initial scan
    perform_scan()
    
    # Schedule scan every 5 minutes
    schedule.every(5).minutes.do(perform_scan)
    
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    logger.info("🚀 Security Sentinel online. Monitoring Core API at %s", TARGET_URL)
    run_scheduler()
