import logging
from typing import Dict, List, Optional
from llm_provider import BaseProvider

logger = logging.getLogger("SYSADMIN_SENTINEL")

class SysAdminSentinel:
    """Specialized Agent for self-healing infrastructure and security audit monitoring"""
    
    def __init__(self, llm: BaseProvider):
        self.llm = llm

    async def troubleshoot_service(self, service_name: str, error_logs: str) -> Optional[Dict]:
        """Analyze crash logs and suggest recovery/repair steps"""
        if not self.llm:
            return None

        prompt = f"""
        SERVICE: {service_name}
        ERROR_LOGS:
        {error_logs}

        TASK:
        Diagnose the failure and provide self-healing steps.
        Output MUST be a JSON object with:
        - diagnosis: string
        - root_cause_theory: string
        - recovery_steps: list of strings (Short shell commands or actions)
        - severity: string ('CRITICAL', 'STABLE', 'DEGRADED')
        """

        system_prompt = "You are the 'Infrastructure Sentinel' for the National Security Platform. You maximize system uptime and stability."

        try:
            logger.info(f"SysAdminSentinel: Troubleshooting {service_name}...")
            return await self.llm.analyze(prompt, system_prompt)
        except Exception as e:
            logger.error(f"SysAdminSentinel Error: {e}")
            return None
