import logging
from typing import Dict, Optional
from llm_provider import BaseProvider

logger = logging.getLogger("CRISIS_AGENT")

class CrisisAgent:
    """Specialized Agent for generating public safety broadcasts and localized instructions"""
    
    def __init__(self, llm: BaseProvider):
        self.llm = llm

    async def generate_broadcast(self, alert_data: Dict, analysis_tier1: Dict) -> Optional[Dict]:
        """Generate a public safety broadcast for a critical alert"""
        if not self.llm or alert_data.get('severity_score', 0) < 0.7:
            return None

        prompt = f"""
        CONTEXT:
        Alert ID: {alert_data.get('id')}
        Type: {alert_data.get('alert_type')}
        Location: {alert_data.get('lga_name')}, {alert_data.get('state_name')}
        Content: {alert_data.get('content_text')}
        
        Tier 1 Entities: {analysis_tier1.get('entities')}

        TASK:
        Generate a localized public safety broadcast.
        Output MUST be a JSON object with:
        - broadcast_title: string (Urgent/Engaging)
        - safety_instructions: list of strings (Short, actionable)
        - evacuation_route_suggestion: string
        - contact_info: string
        """

        system_prompt = "You are the 'Crisis Response Communicator' for the National Security Platform. You prioritize citizen safety and clear communication."

        try:
            logger.info(f"CrisisAgent: Generating broadcast for Alert {alert_data.get('id')}...")
            return await self.llm.analyze(prompt, system_prompt)
        except Exception as e:
            logger.error(f"CrisisAgent Error: {e}")
            return None
