"""
Hybrid Agent System - Combining OpenClaw and Agent Zero

This module provides a unified interface that leverages both frameworks
based on use case requirements:

- OpenClaw: Structured tool chains, heavy processing, multi-step workflows
- Agent Zero: Lightweight agents, field operations, memory-augmented tasks
- Existing NSP Agents: Domain-specific business logic (preserved)

Integration Strategy:
1. Use OpenClaw for backend batch processing & complex analysis pipelines
2. Use Agent Zero for mobile/field agents & real-time responses
3. Keep existing agents for core domain logic (no rewriting needed)
4. Bridge both frameworks where needed
"""
import asyncio
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger("hybrid_agent_system")

# Import both frameworks
from openclaw_framework import (
    OpenClawAgent,
    OpenClawAgents,
    NSPToolBuilder,
    NSPChains,
    Tool,
    ToolResult,
    ToolResultStatus
)

from agent_zero_framework import (
    AgentZero,
    ZeroAgents,
    ZeroToolInterface,
    AdaptiveMemory
)


# ============================================================
# Framework Selector
# ============================================================

class FrameworkSelector:
    """
    Determines which framework to use based on task characteristics.
    """
    
    @staticmethod
    def should_use_openclaw(
        requires_chain: bool = False,
        complex_workflow: bool = False,
        high_volume: bool = False,
        structured_output: bool = False
    ) -> bool:
        """Determine if OpenClaw is better suited"""
        return requires_chain or complex_workflow or high_volume or structured_output
    
    @staticmethod
    def should_use_agentzero(
        field_operation: bool = False,
        low_bandwidth: bool = False,
        requires_memory: bool = False,
        adaptive: bool = False
    ) -> bool:
        """Determine if Agent Zero is better suited"""
        return field_operation or low_bandwidth or requires_memory or adaptive
    
    @staticmethod
    def select_framework(task_type: str) -> str:
        """Select framework based on task type"""
        framework_map = {
            # OpenClaw tasks
            "batch_analysis": "openclaw",
            "threat_pipeline": "openclaw",
            "data_enrichment": "openclaw",
            "report_generation": "openclaw",
            
            # Agent Zero tasks
            "field_report": "agentzero",
            "mobile_update": "agentzero",
            "real_time_alert": "agentzero",
            "situation_awareness": "agentzero",
            
            # Hybrid tasks (use existing logic)
            "standard_alert": "existing",
            "dispatch": "existing",
            "correlation": "existing"
        }
        
        return framework_map.get(task_type, "existing")


# ============================================================
# Hybrid Agent Manager
# ============================================================

@dataclass
class AgentInstance:
    """Wrapper for any agent type"""
    name: str
    framework: str  # "openclaw", "agentzero", or "existing"
    agent: Any
    status: str = "active"

class HybridAgentManager:
    """
    Manages both OpenClaw and Agent Zero agents alongside existing NSP agents.
    Provides unified interface for agent operations.
    """
    
    def __init__(self):
        self.agents: Dict[str, AgentInstance] = {}
        self.llm_provider = None
        self.nlp_analyzer = None
        self.db_pool = None
        self.nats_client = None
        
        logger.info("🔀 Hybrid Agent Manager initialized")
    
    def configure(
        self,
        llm_provider: Any = None,
        nlp_analyzer: Any = None,
        db_pool: Any = None,
        nats_client: Any = None
    ):
        """Configure dependencies for all agents"""
        self.llm_provider = llm_provider
        self.nlp_analyzer = nlp_analyzer
        self.db_pool = db_pool
        self.nats_client = nats_client
        logger.info("✅ Hybrid Agent Manager configured")
    
    # --------------------------------------------------------
    # OpenClaw Agent Management
    # --------------------------------------------------------
    
    def create_openclaw_agent(
        self,
        name: str,
        agent_type: str = "threat_analyzer"
    ) -> OpenClawAgent:
        """Create an OpenClaw agent"""
        
        # Build tools based on available services
        tools = []
        
        if self.nlp_analyzer:
            tools.append(NSPToolBuilder.create_nlp_analyze_tool(self.nlp_analyzer))
        
        if self.llm_provider:
            tools.append(NSPToolBuilder.create_llm_deep_analyze_tool(self.llm_provider))
        
        if self.db_pool:
            tools.append(NSPToolBuilder.create_database_tool(self.db_pool))
        
        if self.nats_client:
            tools.append(NSPToolBuilder.create_nats_publish_tool(self.nats_client))
        
        # Create agent based on type
        if agent_type == "threat_analyzer":
            agent = OpenClawAgents.create_threat_analyzer(
                self.llm_provider,
                self.nlp_analyzer,
                self.db_pool
            )
        elif agent_type == "dispatch":
            agent = OpenClawAgents.create_dispatch_agent(
                self.llm_provider,
                self.nats_client
            )
        elif agent_type == "correlator":
            agent = OpenClawAgents.create_intelligence_correlator(
                self.llm_provider,
                self.db_pool
            )
        else:
            # Generic agent
            agent = OpenClawAgent(
                name=name,
                description=f"OpenClaw agent: {name}",
                llm_provider=self.llm_provider,
                tools=tools
            )
        
        self.agents[name] = AgentInstance(
            name=name,
            framework="openclaw",
            agent=agent
        )
        
        logger.info(f"🤖 Created OpenClaw agent: {name}")
        return agent
    
    # --------------------------------------------------------
    # Agent Zero Agent Management
    # --------------------------------------------------------
    
    def create_agentzero_agent(
        self,
        name: str,
        agent_type: str = "field"
    ) -> AgentZero:
        """Create an Agent Zero agent"""
        
        # Build tools
        tools = []
        
        if self.nlp_analyzer:
            # Wrap NLP as Agent Zero tool
            async def nlp_tool(text: str):
                return self.nlp_analyzer.analyze_alert(text)
            
            tools.append(ZeroToolInterface(
                name="nlp_analyze",
                func=nlp_tool,
                description="Analyze text with NLP"
            ))
        
        if self.llm_provider:
            async def llm_tool(prompt: str):
                return await self.llm_provider.analyze(prompt)
            
            tools.append(ZeroToolInterface(
                name="llm_analyze",
                func=llm_tool,
                description="Analyze with LLM"
            ))
        
        # Create agent based on type
        if agent_type == "field":
            agent = ZeroAgents.create_field_agent(name, self.llm_provider, tools)
        elif agent_type == "analyst":
            agent = ZeroAgents.create_analyst_agent(name, self.llm_provider, tools)
        elif agent_type == "coordinator":
            agent = ZeroAgents.create_coordinator_agent(name, self.llm_provider, tools)
        else:
            agent = AgentZero(
                name=name,
                role="NSP Agent",
                llm_provider=self.llm_provider,
                tools=tools
            )
        
        self.agents[name] = AgentInstance(
            name=name,
            framework="agentzero",
            agent=agent
        )
        
        logger.info(f"🔷 Created Agent Zero: {name}")
        return agent
    
    # --------------------------------------------------------
    # Unified Interface
    # --------------------------------------------------------
    
    async def process_alert(
        self,
        alert_data: Dict,
        preference: str = "auto"
    ) -> Dict:
        """
        Process an alert using the most appropriate framework.
        
        preference: "openclaw", "agentzero", "existing", or "auto"
        """
        
        # Auto-select framework
        if preference == "auto":
            # Determine based on alert characteristics
            content = alert_data.get("content_text", "")
            urgency = alert_data.get("urgency_level", "low")
            
            if len(content) > 500 or urgency == "critical":
                # Complex/large content or critical - use OpenClaw
                preference = "openclaw"
            elif urgency in ["high", "critical"]:
                # Time-sensitive - use Agent Zero for speed
                preference = "agentzero"
            else:
                # Standard - use existing agents
                preference = "existing"
        
        logger.info(f"📨 Processing alert {alert_data.get('id')} with {preference}")
        
        if preference == "openclaw":
            return await self._process_with_openclaw(alert_data)
        elif preference == "agentzero":
            return await self._process_with_agentzero(alert_data)
        else:
            return await self._process_with_existing(alert_data)
    
    async def _process_with_openclaw(self, alert_data: Dict) -> Dict:
        """Process using OpenClaw framework"""
        
        # Get or create threat analyzer
        if "threat_analyzer" not in self.agents:
            self.create_openclaw_agent("threat_analyzer", "threat_analyzer")
        
        agent = self.agents["threat_analyzer"].agent
        
        # Use chain for comprehensive analysis
        chain = NSPChains.full_threat_assessment()
        
        # Execute chain with alert data as input
        input_data = {"description": alert_data.get("content_text", "")}
        
        results = await agent.execute_chain([
            {**chain[0], "params": {"description": input_data["description"]}},
            {**chain[1], "params": {"description": input_data["description"]}}
        ])
        
        # Generate reasoning
        reasoning = await agent.reason(
            {"alert": alert_data, "analysis": results},
            "Assess this threat and provide recommendation"
        )
        
        return {
            "framework": "openclaw",
            "analysis_results": [r.to_dict() for r in results],
            "reasoning": reasoning,
            "recommendation": self._extract_recommendation(reasoning)
        }
    
    async def _process_with_agentzero(self, alert_data: Dict) -> Dict:
        """Process using Agent Zero framework"""
        
        # Get or create field agent
        if "field_agent" not in self.agents:
            self.create_agentzero_agent("field_agent", "field")
        
        agent = self.agents["field_agent"].agent
        
        # Store alert in memory
        agent.remember(
            alert_data,
            importance=0.8,
            context={"type": "alert", "id": alert_data.get("id")}
        )
        
        # Quick think
        thinking = await agent.think(
            f"Analyze this alert: {alert_data.get('content_text', '')}. "
            "What is the threat level and recommended action?",
            use_memory=True
        )
        
        return {
            "framework": "agentzero",
            "thinking": thinking,
            "recommendation": self._extract_recommendation(thinking)
        }
    
    async def _process_with_existing(self, alert_data: Dict) -> Dict:
        """Process using existing NSP agents (placeholder)"""
        # This would integrate with the existing CrisisAgent, DispatchAgent, etc.
        return {
            "framework": "existing",
            "status": "delegated_to_existing_agents",
            "alert_id": alert_data.get("id")
        }
    
    def _extract_recommendation(self, reasoning: str) -> str:
        """Extract recommendation from reasoning text"""
        # Simple extraction - in production would use more sophisticated parsing
        if "critical" in reasoning.lower() or "immediate" in reasoning.lower():
            return "ESCALATE"
        elif "high" in reasoning.lower():
            return "PRIORITY"
        elif "medium" in reasoning.lower():
            return "MONITOR"
        else:
            return "LOG"
    
    # --------------------------------------------------------
    # Agent Status & Management
    # --------------------------------------------------------
    
    def get_status(self) -> Dict:
        """Get status of all agents"""
        status = {
            "total_agents": len(self.agents),
            "by_framework": {
                "openclaw": 0,
                "agentzero": 0,
                "existing": 0
            },
            "agents": {}
        }
        
        for name, instance in self.agents.items():
            status["by_framework"][instance.framework] += 1
            status["agents"][name] = {
                "framework": instance.framework,
                "status": instance.status,
                "details": instance.agent.get_status() if hasattr(instance.agent, 'get_status') else {}
            }
        
        return status
    
    def get_agent(self, name: str) -> Optional[Any]:
        """Get an agent by name"""
        instance = self.agents.get(name)
        return instance.agent if instance else None


# ============================================================
# Workflow Orchestrator
# ============================================================

class WorkflowOrchestrator:
    """
    Orchestrates workflows that span multiple agents and frameworks.
    """
    
    def __init__(self, hybrid_manager: HybridAgentManager):
        self.manager = hybrid_manager
    
    async def run_escalation_workflow(self, alert: Dict) -> Dict:
        """
        Full escalation workflow:
        1. Quick triage with Agent Zero
        2. Deep analysis with OpenClaw if needed
        3. Dispatch decision
        """
        results = {
            "alert_id": alert.get("id"),
            "workflow": "escalation",
            "steps": []
        }
        
        # Step 1: Quick triage with Agent Zero
        triage_result = await self.manager.process_alert(alert, preference="agentzero")
        results["steps"].append({
            "step": "triage",
            "framework": "agentzero",
            "result": triage_result
        })
        
        # Check if escalation needed
        recommendation = triage_result.get("recommendation", "LOG")
        
        if recommendation in ["ESCALATE", "PRIORITY"]:
            # Step 2: Deep analysis with OpenClaw
            deep_result = await self.manager.process_alert(alert, preference="openclaw")
            results["steps"].append({
                "step": "deep_analysis",
                "framework": "openclaw",
                "result": deep_result
            })
            
            results["final_recommendation"] = deep_result.get("recommendation")
        else:
            results["final_recommendation"] = recommendation
        
        return results
    
    async def run_batch_analysis(self, alerts: List[Dict]) -> List[Dict]:
        """Run batch analysis using OpenClaw"""
        # Get or create batch analyzer
        if "batch_analyzer" not in self.manager.agents:
            self.manager.create_openclaw_agent("batch_analyzer", "threat_analyzer")
        
        agent = self.manager.agents["batch_analyzer"].agent
        
        results = []
        for alert in alerts:
            chain_result = await agent.execute_chain([
                {"tool": "nsp_analyze_alert", "params": {"description": alert.get("content_text", "")}}
            ])
            
            reasoning = await agent.reason(
                {"alert": alert, "analysis": chain_result[0] if chain_result else None}
            )
            
            results.append({
                "alert_id": alert.get("id"),
                "analysis": chain_result[0].to_dict() if chain_result else None,
                "reasoning": reasoning
            })
        
        return results


# ============================================================
# Initialization Helper
# ============================================================

def create_hybrid_system(
    llm_provider: Any = None,
    nlp_analyzer: Any = None,
    db_pool: Any = None,
    nats_client: Any = None
) -> HybridAgentManager:
    """
    Create and configure the hybrid agent system.
    
    Returns a fully configured HybridAgentManager with:
    - OpenClaw agents for complex processing
    - Agent Zero agents for field operations
    - Seamless integration with existing NSP infrastructure
    """
    
    # Create manager
    manager = HybridAgentManager()
    
    # Configure dependencies
    manager.configure(
        llm_provider=llm_provider,
        nlp_analyzer=nlp_analyzer,
        db_pool=db_pool,
        nats_client=nats_client
    )
    
    # Pre-create agents based on expected workload
    
    # OpenClaw agents (backend processing)
    manager.create_openclaw_agent("threat_analyzer", "threat_analyzer")
    manager.create_openclaw_agent("correlator", "correlator")
    manager.create_openclaw_agent("dispatch", "dispatch")
    
    # Agent Zero agents (real-time/field)
    manager.create_agentzero_agent("field_agent", "field")
    manager.create_agentzero_agent("analyst_agent", "analyst")
    manager.create_agentzero_agent("coordinator", "coordinator")
    
    logger.info("🎯 Hybrid Agent System fully initialized")
    
    return manager
