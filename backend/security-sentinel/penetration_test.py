#!/usr/bin/env python3
"""
Automated Penetration Testing Scanner for National Security Platform
Performs automated security scans on the platform endpoints
"""

import subprocess
import json
import time
import requests
from datetime import datetime
from typing import Dict, List, Any
import sys
import re


class PenetrationTester:
    """Automated penetration testing scanner"""
    
    def __init__(self, base_url: str = "http://localhost:8086"):
        self.base_url = base_url
        self.findings = []
        self.severity_levels = {
            "CRITICAL": 10,
            "HIGH": 7,
            "MEDIUM": 5,
            "LOW": 3,
            "INFO": 1
        }
        
    def log_finding(self, severity: str, category: str, description: str, evidence: str = ""):
        """Log a security finding"""
        finding = {
            "timestamp": datetime.utcnow().isoformat(),
            "severity": severity,
            "category": category,
            "description": description,
            "evidence": evidence,
            "score": self.severity_levels.get(severity, 0)
        }
        self.findings.append(finding)
        
    def check_ssl_tls(self):
        """Check SSL/TLS configuration"""
        print("[*] Checking SSL/TLS configuration...")
        try:
            import ssl
            import socket
            
            hostname = "localhost"
            port = 8443
            
            context = ssl.create_default_context()
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    version = ssock.version()
                    
                    # Check for weak protocols
                    if version in ['TLSv1', 'TLSv1.1', 'SSLv3']:
                        self.log_finding(
                            "HIGH",
                            "SSL/TLS",
                            f"Weak TLS version detected: {version}",
                            f"Server supports deprecated protocol: {version}"
                        )
                    else:
                        print(f"    [+] TLS version: {version}")
        except Exception as e:
            self.log_finding(
                "MEDIUM",
                "SSL/TLS",
                f"Could not verify SSL/TLS: {str(e)}",
                str(e)
            )
            
    def check_sql_injection(self, endpoints: List[str]):
        """Test for SQL injection vulnerabilities"""
        print("[*] Testing SQL injection vulnerabilities...")
        
        sql_payloads = [
            "' OR '1'='1",
            "' OR '1'='1' --",
            "'; DROP TABLE users; --",
            "' UNION SELECT NULL--",
            "1' AND '1'='1",
        ]
        
        for endpoint in endpoints:
            for payload in sql_payloads:
                try:
                    # Test query parameters
                    url = f"{self.base_url}{endpoint}?id={payload}"
                    response = requests.get(url, timeout=5, verify=False)
                    
                    # Check for SQL error indicators
                    sql_errors = [
                        "SQL syntax",
                        "MySQLSyntaxErrorException",
                        "PostgreSQL",
                        "ORA-",
                        "SQLServer",
                        "warning"
                    ]
                    
                    for error in sql_errors:
                        if error.lower() in response.text.lower():
                            self.log_finding(
                                "CRITICAL",
                                "SQL Injection",
                                f"Potential SQL injection in {endpoint}",
                                f"Payload: {payload}, Error indicator: {error}"
                            )
                            break
                            
                except Exception as e:
                    pass  # Skip failed requests
                    
    def check_xss(self, endpoints: List[str]):
        """Test for Cross-Site Scripting vulnerabilities"""
        print("[*] Testing XSS vulnerabilities...")
        
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "<svg/onload=alert('XSS')>",
            "javascript:alert('XSS')",
        ]
        
        for endpoint in endpoints:
            for payload in xss_payloads:
                try:
                    url = f"{self.base_url}{endpoint}?q={payload}"
                    response = requests.get(url, timeout=5, verify=False)
                    
                    if payload in response.text:
                        self.log_finding(
                            "HIGH",
                            "XSS",
                            f"Potential XSS vulnerability in {endpoint}",
                            f"Payload reflected: {payload}"
                        )
                        
                except Exception as e:
                    pass
                    
    def check_authentication(self):
        """Check authentication mechanisms"""
        print("[*] Testing authentication...")
        
        # Test if authentication is required
        protected_endpoints = [
            "/api/v1/alerts",
            "/api/v1/agency",
            "/api/v1/admin",
        ]
        
        for endpoint in protected_endpoints:
            try:
                url = f"{self.base_url}{endpoint}"
                response = requests.get(url, timeout=5, verify=False)
                
                # Check if endpoint is accessible without auth
                if response.status_code == 200:
                    self.log_finding(
                        "HIGH",
                        "Authentication",
                        f"Protected endpoint accessible without authentication: {endpoint}",
                        f"Status code: {response.status_code}"
                    )
                elif response.status_code == 401:
                    print(f"    [+] {endpoint} requires authentication")
                    
            except Exception as e:
                pass
                
    def check_rate_limiting(self):
        """Check rate limiting"""
        print("[*] Testing rate limiting...")
        
        endpoint = "/api/v1/public-alerts"
        requests_made = 0
        blocked = False
        
        for i in range(20):
            try:
                url = f"{self.base_url}{endpoint}"
                response = requests.get(url, timeout=5, verify=False)
                requests_made += 1
                
                if response.status_code == 429:
                    blocked = True
                    print(f"    [+] Rate limited after {requests_made} requests")
                    break
                    
                time.sleep(0.1)  # Small delay between requests
                
            except Exception as e:
                break
                
        if not blocked:
            self.log_finding(
                "MEDIUM",
                "Rate Limiting",
                "No rate limiting detected",
                f"Made {requests_made} requests without being blocked"
            )
            
    def check_sensitive_data_exposure(self):
        """Check for sensitive data in responses"""
        print("[*] Checking for sensitive data exposure...")
        
        sensitive_patterns = [
            (r'\b\d{3}-\d{2}-\d{4}\b', "Social Security Number"),
            (r'\b\d{16}\b', "Credit Card Number"),
            (r'password["\s]*[:=]["\s]*[^\s,"]+', "Password in response"),
            (r'api[_-]?key["\s]*[:=]["\s]*[^\s,"]+', "API Key in response"),
            (r'token["\s]*[:=]["\s]*[^\s,"]+', "Token in response"),
        ]
        
        endpoints = ["/api/v1/alerts", "/api/v1/users", "/api/v1/agency"]
        
        for endpoint in endpoints:
            try:
                url = f"{self.base_url}{endpoint}"
                response = requests.get(url, timeout=5, verify=False)
                
                for pattern, label in sensitive_patterns:
                    if re.search(pattern, response.text, re.IGNORECASE):
                        self.log_finding(
                            "HIGH",
                            "Sensitive Data",
                            f"Potential {label} exposed in {endpoint}",
                            f"Pattern found: {pattern}"
                        )
                        
            except Exception as e:
                pass
                
    def check_headers(self):
        """Check security headers"""
        print("[*] Checking security headers...")
        
        required_headers = {
            "Strict-Transport-Security": "HSTS header missing",
            "Content-Security-Policy": "CSP header missing",
            "X-Content-Type-Options": "X-Content-Type-Options missing",
            "X-Frame-Options": "X-Frame-Options missing",
        }
        
        try:
            response = requests.get(self.base_url, timeout=5, verify=False)
            
            for header, message in required_headers.items():
                if header not in response.headers:
                    self.log_finding(
                        "MEDIUM",
                        "Security Headers",
                        message,
                        f"Missing header: {header}"
                    )
                else:
                    print(f"    [+] {header}: {response.headers[header]}")
                    
        except Exception as e:
            pass
            
    def generate_report(self) -> Dict[str, Any]:
        """Generate penetration test report"""
        # Calculate risk score
        total_score = sum(f["score"] for f in self.findings)
        
        report = {
            "scan_date": datetime.utcnow().isoformat(),
            "target": self.base_url,
            "total_findings": len(self.findings),
            "risk_score": total_score,
            "findings": sorted(self.findings, key=lambda x: x["score"], reverse=True),
            "summary": {
                "critical": len([f for f in self.findings if f["severity"] == "CRITICAL"]),
                "high": len([f for f in self.findings if f["severity"] == "HIGH"]),
                "medium": len([f for f in self.findings if f["severity"] == "MEDIUM"]),
                "low": len([f for f in self.findings if f["severity"] == "LOW"]),
                "info": len([f for f in self.findings if f["severity"] == "INFO"]),
            }
        }
        
        return report
        
    def run_full_scan(self):
        """Run complete penetration test"""
        print("=" * 60)
        print("NATIONAL SECURITY PLATFORM - PENETRATION TEST")
        print("=" * 60)
        
        # Run all tests
        self.check_ssl_tls()
        self.check_headers()
        self.check_authentication()
        self.check_rate_limiting()
        
        # Test common endpoints
        endpoints = [
            "/api/v1/alerts",
            "/api/v1/public-alerts",
            "/api/v1/safety-scores",
            "/api/v1/agency",
        ]
        
        self.check_sql_injection(endpoints)
        self.check_xss(endpoints)
        self.check_sensitive_data_exposure()
        
        # Generate report
        report = self.generate_report()
        
        # Print summary
        print("\n" + "=" * 60)
        print("SCAN SUMMARY")
        print("=" * 60)
        print(f"Total Findings: {report['total_findings']}")
        print(f"Risk Score: {report['risk_score']}")
        print(f"CRITICAL: {report['summary']['critical']}")
        print(f"HIGH: {report['summary']['high']}")
        print(f"MEDIUM: {report['summary']['medium']}")
        print(f"LOW: {report['summary']['low']}")
        print(f"INFO: {report['summary']['info']}")
        
        # Save report
        report_file = f"pen_test_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
            
        print(f"\n[+] Report saved to: {report_file}")
        
        # Exit with appropriate code
        if report['summary']['critical'] > 0 or report['summary']['high'] > 0:
            print("\n[!] HIGH SEVERITY ISSUES FOUND - REVIEW REQUIRED")
            return 1
        else:
            print("\n[+] Scan complete - No critical issues")
            return 0


if __name__ == "__main__":
    # Suppress SSL warnings for testing
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    # Get target URL
    target = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8086"
    
    # Run scan
    scanner = PenetrationTester(target)
    exit_code = scanner.run_full_scan()
    sys.exit(exit_code)
