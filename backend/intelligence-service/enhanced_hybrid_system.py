"""
Enhanced Hybrid Agent System for National Security Platform
============================================================

Combines:
- OpenClaw (tool orchestration, structured chains)
- Agent Zero (lightweight, adaptive memory)
- LangChain (external data sources, RAG, chains)
- CrewAI-style (multi-agent teams, role-based)
- Open Interpreter-style (code execution, actions)

This creates a comprehensive agent ecosystem for NSP.
"""
import asyncio
import json
import logging
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

logger = logging.getLogger("enhanced_hybrid")

# ============================================================
# LangChain Integration
# ============================================================

class LangChainIntegration:
    """
    LangChain-style capabilities for NSP:
    - External data source connections
    - RAG (Retrieval-Augmented Generation)
    - LLM chains and pipelines
    - Document loaders and text splitting
    """
    
    def __init__(self, llm_provider=None):
        self.llm = llm_provider
        self.document_store: List[Dict] = []
        self.vector_store_simulated = {}  # Simplified vector store
        
    def add_document(self, content: str, metadata: Dict = None):
        """Add document to the store"""
        doc = {
            "id": len(self.document_store),
            "content": content,
            "metadata": metadata or {},
            "added_at": datetime.utcnow().isoformat()
        }
        self.document_store.append(doc)
        
        # Simple keyword-based indexing
        keywords = content.lower().split()
        for kw in keywords:
            if kw not in self.vector_store_simulated:
                self.vector_store_simulated[kw] = []
            self.vector_store_simulated[kw].append(doc["id"])
        
        return doc["id"]
    
    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        """Retrieve relevant documents"""
        query_words = query.lower().split()
        scores = {}
        
        for word in query_words:
            if word in self.vector_store_simulated:
                for doc_id in self.vector_store_simulated[word]:
                    scores[doc_id] = scores.get(doc_id, 0) + 1
        
        # Sort by score
        sorted_ids = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        results = []
        for doc_id, score in sorted_ids[:top_k]:
            doc = self.document_store[doc_id]
            results.append({
                **doc,
                "relevance_score": score / len(query_words)
            })
        
        return results
    
    async def rag_query(self, query: str, system_prompt: str = None) -> Dict:
        """Retrieval-Augmented Generation"""
        # Get relevant documents
        docs = self.retrieve(query)
        
        # Build context from docs
        context = "\n\n".join([d["content"][:500] for d in docs])
        
        # If LLM available, generate with context
        if self.llm:
            prompt = f"""Context from intelligence database:
{context}

User query: {query}

Provide a detailed response based on the above context:"""
            
            response = await self.llm.analyze(
                prompt,
                system_prompt=system_prompt or "You are an intelligence analyst."
            )
            
            return {
                "query": query,
                "retrieved_docs": len(docs),
                "response": response,
                "sources": [{"id": d["id"], "score": d["relevance_score"]} for d in docs]
            }
        
        return {
            "query": query,
            "retrieved_docs": len(docs),
            "documents": docs
        }
    
    # --------------------------------------------------------
    # Pre-built Chains
    # --------------------------------------------------------
    
    async def threat_intelligence_chain(self, alert_data: Dict) -> Dict:
        """RAG chain for threat intelligence"""
        query = alert_data.get("content_text", "")
        
        # First, retrieve related historical incidents
        historical = self.retrieve(query, top_k=10)
        
        # Build threat pattern analysis
        if self.llm:
            pattern_prompt = f"""Analyze this alert: {query}

Related historical incidents:
{json.dumps([{"id": h["id"], "content": h["content"][:200]} for h in historical[:5]], indent=2)}

Identify:
1. Pattern matches with historical data
2. Threat actors similarity
3. Recommended response based on past outcomes"""
            
            analysis = await self.llm.analyze(pattern_prompt)
            
            return {
                "alert_id": alert_data.get("id"),
                "historical_matches": len(historical),
                "pattern_analysis": analysis,
                "risk_assessment": "HIGH" if len(historical) > 3 else "MEDIUM"
            }
        
        return {"error": "LLM not available"}


# ============================================================
# CrewAI-Style Multi-Agent Teams
# ============================================================

@dataclass
class AgentRole:
    """Role definition for CrewAI-style agents"""
    name: str
    description: str
    goals: List[str]
    backstory: str

class CrewAgent:
    """Individual agent with role for multi-agent teams"""
    
    def __init__(
        self,
        role: AgentRole,
        tools: List[Any] = None,
        llm_provider: Any = None
    ):
        self.role = role
        self.tools = tools or []
        self.llm = llm_provider
        self.memory: List[Dict] = []
        
    async def execute_task(self, task: str, context: Dict = None) -> Dict:
        """Execute a task based on role"""
        prompt = f"""You are {self.role.name}.
{self.role.description}

Your goals:
{chr(10).join(f"- {g}" for g in self.role.goals)}

Task: {task}

{('Context: ' + json.dumps(context)) if context else ''}

Execute this task and provide your output:"""
        
        if self.llm:
            response = await self.llm.analyze(prompt)
            return {
                "agent": self.role.name,
                "task": task,
                "result": response,
                "status": "completed"
            }
        
        return {
            "agent": self.role.name,
            "task": task,
            "result": f"[Simulated] {self.role.name} would process: {task}",
            "status": "completed"
        }

class CrewManager:
    """
    CrewAI-style team management:
    - Create specialized agent teams
    - Hierarchical task execution
    - Collaborative problem solving
    """
    
    def __init__(self, llm_provider=None):
        self.llm = llm_provider
        self.agents: Dict[str, CrewAgent] = {}
    
    def create_agent(
        self,
        name: str,
        description: str,
        goals: List[str],
        backstory: str,
        tools: List[Any] = None
    ) -> CrewAgent:
        """Create a new crew agent with role"""
        role = AgentRole(
            name=name,
            description=description,
            goals=goals,
            backstory=backstory
        )
        
        agent = CrewAgent(role, tools, self.llm)
        self.agents[name] = agent
        
        logger.info(f"👤 Created crew agent: {name}")
        return agent
    
    async def execute_crew_task(
        self,
        task: str,
        agent_names: List[str] = None,
        process: str = "sequential"  # or "hierarchical"
    ) -> Dict:
        """
        Execute task with multiple agents.
        
        - sequential: Agents work one after another, passing context
        - hierarchical: Manager agent delegates to specialists
        """
        results = []
        
        # Use all agents or specific subset
        selected_agents = [
            self.agents[name] for name in (agent_names or self.agents.keys())
            if name in self.agents
        ]
        
        if not selected_agents:
            return {"error": "No agents available"}
        
        context = {}
        
        if process == "sequential":
            # Sequential: each agent builds on previous
            for agent in selected_agents:
                result = await agent.execute_task(task, context)
                results.append(result)
                context[agent.role.name] = result.get("result", "")
        
        elif process == "hierarchical":
            # First agent is "manager"
            manager = selected_agents[0]
            manager_result = await manager.execute_task(
                f"Break down and delegate this task: {task}",
                context
            )
            results.append(manager_result)
            
            # Delegate to specialists
            for agent in selected_agents[1:]:
                result = await agent.execute_task(task, context)
                results.append(result)
        
        return {
            "task": task,
            "process": process,
            "agent_count": len(selected_agents),
            "results": results,
            "final_summary": self._summarize_results(results)
        }
    
    def _summarize_results(self, results: List[Dict]) -> str:
        """Combine agent results into summary"""
        summaries = [r.get("result", "")[:200] for r in results]
        return " | ".join(summaries)


# ============================================================
# Pre-built NSP Crews
# ============================================================

class NSPCrews:
    """Pre-configured agent crews for NSP operations"""
    
    @staticmethod
    def create_incident_response_crew(llm_provider=None) -> CrewManager:
        """Create a crew for incident response"""
        crew = CrewManager(llm_provider)
        
        # Commander - coordinates response
        crew.create_agent(
            name="IncidentCommander",
            description="Coordinates overall incident response",
            goals=[
                "Ensure rapid, effective response",
                "Allocate resources appropriately",
                "Maintain situational awareness"
            ],
            backstory="Experienced emergency management professional"
        )
        
        # Intelligence Analyst
        crew.create_agent(
            name="IntelligenceAnalyst",
            description="Analyzes threat intelligence",
            goals=[
                "Identify threat actors",
                "Assess severity and scope",
                "Provide actionable intelligence"
            ],
            backstory="Former intelligence officer with counter-terrorism experience"
        )
        
        # Tactical Lead
        crew.create_agent(
            name="TacticalLead",
            description="Directs field operations",
            goals=[
                "Deploy appropriate assets",
                "Coordinate with ground units",
                "Ensure operator safety"
            ],
            backstory="Field operations commander with tactical expertise"
        )
        
        # Communications
        crew.create_agent(
            name="CommunicationsLead",
            description="Manages alerts and notifications",
            goals=[
                "Notify relevant agencies",
                "Issue public warnings if needed",
                "Maintain communication chains"
            ],
            backstory="Public safety communications specialist"
        )
        
        return crew
    
    @staticmethod
    def create_intelligence_gathering_crew(llm_provider=None) -> CrewManager:
        """Create a crew for intelligence gathering"""
        crew = CrewManager(llm_provider)
        
        crew.create_agent(
            name="OSINTCollector",
            description="Open-source intelligence collection",
            goals=["Monitor social media", "Scan news sources", "Identify relevant patterns"],
            backstory="OSINT specialist with monitoring tools expertise"
        )
        
        crew.create_agent(
            name="PatternAnalyzer",
            description="Analyze patterns across data",
            goals=["Identify trends", "Correlate incidents", "Predict emerging threats"],
            backstory="Data analyst with predictive modeling experience"
        )
        
        crew.create_agent(
            name="ThreatReporter",
            description="Compile intelligence reports",
            goals=["Synthesize findings", "Provide actionable insights", "Maintain documentation"],
            backstory="Intelligence report writer"
        )
        
        return crew


# ============================================================
# Open Interpreter-Style Execution
# ============================================================

class NSPActionExecutor:
    """
    Open Interpreter-style action execution:
    - Execute code for analysis
    - Generate reports
    - Create visualizations
    - Send notifications
    """
    
    def __init__(self, db_pool=None, nats_client=None, llm_provider=None):
        self.db_pool = db_pool
        self.nats_client = nats_client
        self.llm = llm_provider
        self.execution_history: List[Dict] = []
    
    async def generate_incident_report(self, alert_data: Dict, analysis: Dict) -> Dict:
        """Generate formatted incident report"""
        
        report_template = f"""
══════════════════════════════════════════════════════════
NATIONAL SECURITY PLATFORM - INCIDENT REPORT
══════════════════════════════════════════════════════════

INCIDENT ID: {alert_data.get('id', 'N/A')}
TIMESTAMP: {alert_data.get('created_at', datetime.utcnow().isoformat())}
SEVERITY: {analysis.get('severity_score', 'N/A')}

──────────────────────────────────────────────────────────
INCIDENT DETAILS
──────────────────────────────────────────────────────────
{alert_data.get('content_text', 'No description')}

──────────────────────────────────────────────────────────
THREAT ASSESSMENT
──────────────────────────────────────────────────────────
Urgency Level: {analysis.get('urgency_level', 'N/A')}
Risk Keywords: {', '.join(analysis.get('keywords', [])[:10])}

Entities Identified:
{json.dumps(analysis.get('entities', {}), indent=2)}

──────────────────────────────────────────────────────────
RECOMMENDATION
──────────────────────────────────────────────────────────
{analysis.get('recommendation', 'Review and escalate as appropriate')}

══════════════════════════════════════════════════════════
Generated by NSP Intelligence Service
══════════════════════════════════════════════════════════
"""
        
        # Store report
        if self.db_pool:
            try:
                async with self.db_pool.acquire() as conn:
                    await conn.execute(
                        """INSERT INTO incident_reports (alert_id, report_content, created_at) 
                           VALUES ($1, $2, NOW())""",
                        alert_data.get('id'), report_template
                    )
            except Exception as e:
                logger.error(f"Failed to store report: {e}")
        
        self.execution_history.append({
            "action": "generate_incident_report",
            "alert_id": alert_data.get('id'),
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {
            "report": report_template,
            "alert_id": alert_data.get('id'),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    async def create_threat_visualization(self, alert_data: Dict, analysis: Dict) -> Dict:
        """Create map visualization data for tactical display"""
        
        entities = analysis.get('entities', {})
        locations = entities.get('locations', [])
        
        visualization_data = {
            "type": "threat_marker",
            "alert_id": alert_data.get('id'),
            "coordinates": self._extract_coordinates(locations),
            "severity": analysis.get('severity_score', 0.5),
            "urgency": analysis.get('urgency_level', 'low'),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Could be sent to Mapbox or similar
        if self.nats_client:
            try:
                js = self.nats_client.jetstream()
                await js.publish("tactical.visualization", json.dumps(visualization_data).encode())
            except Exception as e:
                logger.error(f"Failed to publish visualization: {e}")
        
        return visualization_data
    
    def _extract_coordinates(self, locations: List[str]) -> Optional[Dict]:
        """Extract coordinates from location names (simplified)"""
        # In production, would use geocoding service
        # This is a placeholder
        return {"lat": 9.0820, "lng": 8.6753}  # Nigeria center
    
    async def send_agency_notification(
        self,
        agencies: List[str],
        alert_data: Dict,
        priority: str = "normal"
    ) -> Dict:
        """Send notifications to relevant agencies"""
        
        notification = {
            "alert_id": alert_data.get('id'),
            "agencies": agencies,
            "priority": priority,
            "content": alert_data.get('content_text', '')[:500],
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if self.nats_client:
            for agency in agencies:
                subject = f"alerts.{agency}.{priority}"
                try:
                    js = self.nats_client.jetstream()
                    await js.publish(subject, json.dumps(notification).encode())
                    logger.info(f"📨 Notified {agency}")
                except Exception as e:
                    logger.error(f"Failed to notify {agency}: {e}")
        
        return {
            "notified": agencies,
            "status": "sent",
            "timestamp": notification["timestamp"]
        }


# ============================================================
# Ultimate Hybrid System
# ============================================================

class UltimateHybridSystem:
    """
    The complete hybrid system combining:
    - OpenClaw (tool orchestration)
    - Agent Zero (adaptive memory)
    - LangChain (RAG, external data)
    - CrewAI (multi-agent teams)
    - NSPActionExecutor (automated actions)
    """
    
    def __init__(self, config: Dict = None):
        self.config = config or {}
        
        # Components
        self.langchain = None
        self.crew_manager = None
        self.action_executor = None
        
        # OpenClaw/AgentZero from previous system
        self.openclaw_agents = {}
        self.agentzero_agents = {}
        
        logger.info("🎯 Ultimate Hybrid System initialized")
    
    def configure(
        self,
        llm_provider=None,
        nlp_analyzer=None,
        db_pool=None,
        nats_client=None
    ):
        """Configure all components"""
        
        # LangChain
        self.langchain = LangChainIntegration(llm_provider)
        
        # CrewAI-style crews
        self.crew_manager = NSPCrews.create_incident_response_crew(llm_provider)
        
        # Add intelligence gathering crew
        intel_crew = NSPCrews.create_intelligence_gathering_crew(llm_provider)
        for name, agent in intel_crew.agents.items():
            self.crew_manager.agents[name] = agent
        
        # Action executor
        self.action_executor = NSPActionExecutor(db_pool, nats_client, llm_provider)
        
        logger.info("✅ All components configured")
    
    # --------------------------------------------------------
    # Processing Methods
    # --------------------------------------------------------
    
    async def process_alert_full(self, alert_data: Dict) -> Dict:
        """
        Full processing pipeline:
        1. LangChain RAG - get historical context
        2. CrewAI - collaborative analysis
        3. ActionExecutor - generate reports, notify
        """
        results = {
            "alert_id": alert_data.get('id'),
            "timestamp": datetime.utcnow().isoformat(),
            "stages": {}
        }
        
        # Stage 1: RAG with historical data
        if self.langchain:
            rag_result = await self.langchain.threat_intelligence_chain(alert_data)
            results["stages"]["rag"] = rag_result
        
        # Stage 2: Crew analysis (if critical/high)
        urgency = alert_data.get('urgency_level', 'low')
        if urgency in ['critical', 'high'] and self.crew_manager:
            crew_result = await self.crew_manager.execute_crew_task(
                f"Analyze and respond to: {alert_data.get('content_text', '')}",
                process="hierarchical"
            )
            results["stages"]["crew"] = crew_result
        
        # Stage 3: Generate report
        if self.action_executor:
            report = await self.action_executor.generate_incident_report(
                alert_data,
                results.get("stages", {}).get("rag", {})
            )
            results["stages"]["report"] = report
        
        # Stage 4: Create visualization
        if self.action_executor:
            viz = await self.action_executor.create_threat_visualization(
                alert_data,
                results.get("stages", {}).get("rag", {})
            )
            results["stages"]["visualization"] = viz
        
        return results
    
    async def run_intelligence_campaign(self, topic: str) -> Dict:
        """Run a multi-agent intelligence gathering campaign"""
        
        if not self.crew_manager:
            return {"error": "Crew manager not configured"}
        
        # Use intelligence gathering crew
        result = await self.crew_manager.execute_crew_task(
            f"Gather intelligence on: {topic}",
            agent_names=["OSINTCollector", "PatternAnalyzer", "ThreatReporter"],
            process="sequential"
        )
        
        return result
    
    def get_system_status(self) -> Dict:
        """Get status of all components"""
        return {
            "langchain": {
                "documents": len(self.langchain.document_store) if self.langchain else 0,
                "indexed_terms": len(self.langchain.vector_store_simulated) if self.langchain else 0
            },
            "crewai": {
                "agents": list(self.crew_manager.agents.keys()) if self.crew_manager else []
            },
            "actions": {
                "executions": len(self.action_executor.execution_history) if self.action_executor else 0
            }
        }


# ============================================================
# Factory Function
# ============================================================

def create_ultimate_hybrid_system(
    llm_provider=None,
    nlp_analyzer=None,
    db_pool=None,
    nats_client=None
) -> UltimateHybridSystem:
    """
    Create and configure the ultimate hybrid system.
    
    Returns fully configured system with:
    - LangChain RAG capabilities
    - CrewAI multi-agent teams
    - Action execution
    - Integration with existing OpenClaw/AgentZero
    """
    system = UltimateHybridSystem()
    system.configure(
        llm_provider=llm_provider,
        nlp_analyzer=nlp_analyzer,
        db_pool=db_pool,
        nats_client=nats_client
    )
    
    logger.info("🚀 Ultimate Hybrid System ready")
    return system
