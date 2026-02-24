import logging
from typing import Dict, Optional
from llm_provider import BaseProvider

logger = logging.getLogger("SENTINEL_ANALYST")

class SentinelAnalyst:
    """Specialized Agent for predictive threat arbitrage and cross-sector correlation"""
    
    def __init__(self, llm: BaseProvider):
        self.llm = llm

    async def correlate_threat(self, alert_data: Dict, regional_context: Optional[Dict] = None) -> Optional[Dict]:
        """Analyze if a new alert matches broader regional patterns or threat trends"""
        if not self.llm:
            return None

        prompt = f"""
        NEW INCIDENT:
        Type: {alert_data.get('alert_type')}
        Location: {alert_data.get('lga_name')}, {alert_data.get('state_name')}
        Content: {alert_data.get('content_text')}
        
        REGIONAL_CONTEXT: {regional_context or 'No historical context provided'}

        TASK:
        Analyze cross-sector risk and correlation.
        Output MUST be a JSON object with:
        - correlation_score: float (0.0 to 1.0)
        - is_coordinated_attack: boolean
        - predictive_warning: string (Prediction of next 12-24 hours)
        - risk_vector_shift: string (How the profile of the area is changing)
        """

        system_prompt = "You are the 'National Strategic Sentinel' for the NSP. You specialize in pattern recognition and predictive intelligence."

        try:
            logger.info(f"SentinelAnalyst: Correlating threat for Alert {alert_data.get('id')}...")
            return await self.llm.analyze(prompt, system_prompt)
        except Exception as e:
            logger.error(f"SentinelAnalyst Error: {e}")
            return None
