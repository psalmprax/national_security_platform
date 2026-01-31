import requests
import time
import schedule
import os
import logging
import json
import psycopg2
import socket
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
    {"path": "/api/v1/alerts", "expected_status": 401, "protected": True},
]

REQUIRED_HEADERS = [
    "Strict-Transport-Security",
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "X-XSS-Protection"
]

SQLI_PAYLOADS = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "\" OR 1=1 --",
    "admin'--"
]

def check_port(host, port, timeout=2):
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, socket.gaierror):
        return False

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
            "scanner": "Advanced Security Sentinel v2.0",
            "target": TARGET_URL,
            "timestamp": time.time()
        }
        
        cur.execute(query, ("multi-service", status, Json(findings), Json(meta_data)))
        conn.commit()
        cur.close()
        conn.close()
        logger.info("💾 Enriched scan results persisted.")
    except Exception as e:
        logger.error(f"❌ Persistence failed: {e}")

def perform_scan():
    logger.info("🛡️ Starting Advanced Cyber Security Scan...")
    findings = []
    
    # 1. Endpoint & Header Analysis
    for ep in ENDPOINTS_TO_SCAN:
        full_url = f"{TARGET_URL}{ep['path']}"
        try:
            response = requests.get(full_url, timeout=5, verify=False)
            # logger.info(f"DEBUG Headers for {ep['path']}: {dict(response.headers)}")
            
            # Auth Regressions
            if ep['protected'] and response.status_code == 200:
                findings.append({
                    "type": "VULNERABILITY",
                    "severity": "CRITICAL",
                    "path": ep['path'],
                    "message": f"Auth bypass detected on {ep['path']}!",
                    "remediation": "Check AuthMiddleware registration in main.go"
                })

            # Headers (Case-insensitive check via requests)
            for header in REQUIRED_HEADERS:
                if header not in response.headers:
                    findings.append({
                        "type": "CONFIG_ISSUE",
                        "severity": "MEDIUM",
                        "path": ep['path'],
                        "message": f"Missing security header: {header}",
                        "remediation": "Add header to middleware/stack.go"
                    })

            # SQL Injection Probing (GET params)
            for payload in SQLI_PAYLOADS:
                probe_url = f"{full_url}?id={payload}"
                probe_res = requests.get(probe_url, timeout=5, verify=False)
                if probe_res.status_code == 500:
                    findings.append({
                        "type": "SQL_INJECTION",
                        "severity": "HIGH",
                        "path": ep['path'],
                        "message": f"Possible SQLi vulnerability detected with payload: {payload}",
                        "remediation": "Ensure all database queries use parameterized placeholders."
                    })

        except Exception as e:
            logger.warning(f"Failed to scan {full_url}: {e}")

    # 2. Rate Limiting Verification
    logger.info("🧪 Testing Rate Limiting...")
    rate_limit_hits = 0
    for _ in range(15):
        try:
            res = requests.get(f"{TARGET_URL}/health", timeout=1, verify=False)
            if res.status_code == 429:
                rate_limit_hits += 1
        except: pass
    
    if rate_limit_hits == 0:
        findings.append({
            "type": "DOS_VULNERABILITY",
            "severity": "HIGH",
            "path": "/health",
            "message": "Rate limiting appears inactive. Brute force or DoS possible.",
            "remediation": "Configure nginx limit_req or internal rate limiting middleware."
        })

    # 3. Infrastructure Audits
    infra_checks = [
        {"name": "Redis", "host": "redis", "port": 6379, "severity": "MEDIUM"},
        {"name": "NATS", "host": "nats", "port": 4222, "severity": "HIGH"},
        {"name": "MinIO", "host": "minio", "port": 9000, "severity": "MEDIUM"},
        {"name": "CockroachDB", "host": "cockroachdb", "port": 26257, "severity": "CRITICAL"},
    ]

    for check in infra_checks:
        if check_port(check['host'], check['port']):
            # This is INFO if expected, but we can check if they are "TOO" accessible
            # For this MVP, we just log that we verified they are UP.
            pass
        else:
            findings.append({
                "type": "INFRA_FAILURE",
                "severity": check['severity'],
                "path": check['name'],
                "message": f"Core infrastructure component {check['name']} is unreachable!",
                "remediation": "Check docker-compose logs and service health."
            })

    status = "PASSED" if not findings else "FAILED"
    logger.info(f"🚨 Scan result: {status} ({len(findings)} issues)")
    persist_results(status, findings)

def run_scheduler():
    perform_scan()
    schedule.every(5).minutes.do(perform_scan)
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    logger.info("🚀 Security Sentinel v2.0 Active.")
    run_scheduler()
