import logging
from typing import Dict, List, Optional
from llm_provider import BaseProvider

logger = logging.getLogger("DISPATCH_AGENT")

class DispatchAgent:
    """Specialized Agent for autonomous tactical dispatch and resource management"""
    
    def __init__(self, llm: BaseProvider):
        self.llm = llm

    async def suggest_deployment(self, alert_data: Dict, analysis_tier1: Dict) -> Optional[Dict]:
        """Suggest tactical assets and deployment strategy for a high-threat alert"""
        if not self.llm or alert_data.get('severity_score', 0) < 0.8:
            return None

        prompt = f"""
        CONTEXT:
        Alert ID: {alert_data.get('id')}
        Severity: {alert_data.get('severity_score')}
        Type: {alert_data.get('alert_type')}
        Description: {alert_data.get('content_text')}
        
        Tier 1 Metadata: {analysis_tier1.get('entities')}

        TASK:
        Propose a tactical response.
        Output MUST be a JSON object with:
        - recommended_asset_types: list of strings (e.g., 'RAPID_RESPONSE', 'MEDICAL', 'AIR_SUPPORT')
        - mission_priority: string ('IMMEDIATE', 'HIGH', 'ROUTINE')
        - suggested_tactical_protocol: string (e.g., 'ENVELOPMENT', 'STABILIZATION', 'EVAC_CORRIDOR')
        - reasoning: string
        """

        system_prompt = "You are the 'Tactical Command Dispatcher' for the National Security Platform. You aim for maximum efficiency and threat neutralization."

        try:
            logger.info(f"DispatchAgent: Suggesting deployment for Alert {alert_data.get('id')}...")
            return await self.llm.analyze(prompt, system_prompt)
        except Exception as e:
            logger.error(f"DispatchAgent Error: {e}")
            return None
