"""
OpenClaw Framework Integration for National Security Platform

This module provides OpenClaw-compatible agent framework with:
- Tool definition and execution system
- Agent base class with memory management
- Chain-of-thought reasoning
- Tool orchestration for multi-step workflows

Based on OpenClaw architecture principles adapted for NSP use cases.
"""
import asyncio
import logging
import json
from typing import Dict, List, Any, Optional, Callable, Awaitable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid

logger = logging.getLogger("openclaw_framework")

# ============================================================
# Tool System
# ============================================================

class ToolResultStatus(Enum):
    SUCCESS = "success"
    ERROR = "error"
    PARTIAL = "partial"

@dataclass
class ToolResult:
    """Result from tool execution"""
    status: ToolResultStatus
    data: Any
    error: Optional[str] = None
    execution_time_ms: float = 0.0
    
    def to_dict(self) -> Dict:
        return {
            "status": self.status.value,
            "data": self.data,
            "error": self.error,
            "execution_time_ms": self.execution_time_ms
        }

@dataclass
class Tool:
    """OpenClaw Tool definition"""
    name: str
    description: str
    parameters: Dict[str, Any]
    handler: Callable[..., Awaitable[ToolResult]]
    category: str = "general"
    requires_approval: bool = False
    
    def __post_init__(self):
        logger.info(f"📦 Registered tool: {self.name} (category: {self.category})")

# ============================================================
# Memory System
# ============================================================

@dataclass
class MemoryEntry:
    """Single memory entry"""
    id: str
    content: Any
    timestamp: datetime
    importance: float = 0.5
    tags: List[str] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)

class AgentMemory:
    """Agent memory with importance-based retention"""
    
    def __init__(self, max_entries: int = 100):
        self.max_entries = max_entries
        self.entries: List[MemoryEntry] = []
    
    def add(self, content: Any, importance: float = 0.5, tags: List[str] = None, metadata: Dict = None):
        entry = MemoryEntry(
            id=str(uuid.uuid4()),
            content=content,
            timestamp=datetime.utcnow(),
            importance=importance,
            tags=tags or [],
            metadata=metadata or {}
        )
        self.entries.append(entry)
        
        # Trim if over capacity - keep highest importance
        if len(self.entries) > self.max_entries:
            self.entries.sort(key=lambda x: x.importance, reverse=True)
            self.entries = self.entries[:self.max_entries]
        
        return entry
    
    def search(self, query: str = None, tags: List[str] = None, limit: int = 10) -> List[MemoryEntry]:
        results = self.entries
        
        if tags:
            results = [e for e in results if any(t in e.tags for t in tags)]
        
        # Sort by importance and recency
        results.sort(key=lambda x: (x.importance, x.timestamp), reverse=True)
        return results[:limit]
    
    def get_recent(self, hours: int = 24, limit: int = 20) -> List[MemoryEntry]:
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        recent = [e for e in self.entries if e.timestamp > cutoff]
        recent.sort(key=lambda x: x.timestamp, reverse=True)
        return recent[:limit]
    
    def clear(self):
        self.entries.clear()

# ============================================================
# Agent Base Class
# ============================================================

class OpenClawAgent:
    """
    Base class for OpenClaw-compatible agents.
    Provides tool execution, memory, and reasoning capabilities.
    """
    
    def __init__(
        self,
        name: str,
        description: str,
        llm_provider: Any = None,
        tools: List[Tool] = None,
        max_memory_entries: int = 100,
        system_prompt: str = None
    ):
        self.name = name
        self.description = description
        self.llm = llm_provider
        self.tools = {t.name: t for t in (tools or [])}
        self.memory = AgentMemory(max_entries=max_memory_entries)
        self.system_prompt = system_prompt or self._default_system_prompt()
        self.execution_history: List[Dict] = []
        
        logger.info(f"🤖 Initialized OpenClaw agent: {name}")
    
    def _default_system_prompt(self) -> str:
        return f"""You are {self.name}, an AI agent for the National Security Platform.
Your role: {self.description}
Always prioritize accuracy, security, and appropriate escalation."""
    
    def register_tool(self, tool: Tool):
        """Register a new tool"""
        self.tools[tool.name] = tool
        logger.info(f"✅ Tool registered: {tool.name}")
    
    async def execute_tool(self, tool_name: str, parameters: Dict) -> ToolResult:
        """Execute a tool by name with given parameters"""
        import time
        start = time.time()
        
        if tool_name not in self.tools:
            return ToolResult(
                status=ToolResultStatus.ERROR,
                data=None,
                error=f"Tool '{tool_name}' not found"
            )
        
        tool = self.tools[tool_name]
        
        try:
            logger.info(f"🔧 Executing tool: {tool_name} with params: {parameters}")
            result = await tool.handler(**parameters)
            result.execution_time_ms = (time.time() - start) * 1000
            
            # Store in memory
            self.memory.add(
                content={
                    "tool": tool_name,
                    "parameters": parameters,
                    "result": result.to_dict()
                },
                importance=0.7,
                tags=["tool_execution", tool.category]
            )
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Tool execution error: {tool_name} - {e}")
            return ToolResult(
                status=ToolResultStatus.ERROR,
                data=None,
                error=str(e),
                execution_time_ms=(time.time() - start) * 1000
            )
    
    async def execute_chain(self, chain: List[Dict]) -> List[ToolResult]:
        """
        Execute a chain of tools in sequence.
        Each step can use previous results.
        
        chain format: [
            {"tool": "tool_name", "params": {...}},
            {"tool": "next_tool", "params": {"$prev": "tool_name", "field": "data"}}
        ]
        """
        results = {}
        chain_results = []
        
        for step in chain:
            tool_name = step.get("tool")
            params = step.get("params", {})
            
            # Resolve references to previous results
            resolved_params = self._resolve_params(params, results)
            
            result = await self.execute_tool(tool_name, resolved_params)
            results[tool_name] = result
            chain_results.append(result)
            
            # Stop chain on error unless marked to continue
            if result.status == ToolResultStatus.ERROR and not step.get("continue_on_error", False):
                logger.warning(f"⚠️ Chain stopped at {tool_name} due to error")
                break
        
        return chain_results
    
    def _resolve_params(self, params: Dict, previous_results: Dict) -> Dict:
        """Resolve parameter references like $prev"""
        resolved = {}
        
        for key, value in params.items():
            if isinstance(value, str) and value.startswith("$prev:"):
                # Format: $prev:tool_name.field
                parts = value.split(":", 1)[1].split(".", 1)
                prev_tool = parts[0]
                field_path = parts[1] if len(parts) > 1 else None
                
                if prev_tool in previous_results:
                    prev_result = previous_results[prev_tool]
                    if field_path:
                        # Navigate nested field
                        data = prev_result.data
                        for part in field_path.split("."):
                            data = data.get(part, {}) if isinstance(data, dict) else None
                        resolved[key] = data
                    else:
                        resolved[key] = prev_result.data
                else:
                    resolved[key] = value
            else:
                resolved[key] = value
        
        return resolved
    
    async def reason(self, context: Dict, question: str = None) -> str:
        """
        Use LLM for reasoning about a situation.
        Falls back to rule-based if no LLM available.
        """
        if not self.llm:
            return self._rule_based_reasoning(context)
        
        prompt = f"""{self.system_prompt}

Context:
{json.dumps(context, indent=2)}

{'Question: ' + question if question else 'Analyze the above context and provide your assessment.'}

Provide your reasoning and recommendation."""
        
        try:
            response = await self.llm.analyze(
                prompt,
                system_prompt="You are a national security analyst. Provide detailed, actionable intelligence."
            )
            
            # Store reasoning in memory
            self.memory.add(
                content={"context": context, "reasoning": response},
                importance=0.8,
                tags=["reasoning", "analysis"]
            )
            
            return response
        except Exception as e:
            logger.error(f"LLM reasoning error: {e}")
            return self._rule_based_reasoning(context)
    
    def _rule_based_reasoning(self, context: Dict) -> str:
        """Fallback reasoning without LLM"""
        urgency = context.get("urgency_level", "low")
        severity = context.get("severity_score", 0.0)
        
        if severity > 0.8 or urgency == "critical":
            return "CRITICAL: Immediate escalation required. Recommend dispatching tactical units."
        elif severity > 0.5 or urgency == "high":
            return "HIGH: Priority response needed. Assign investigative team."
        elif severity > 0.2 or urgency == "medium":
            return "MEDIUM: Standard monitoring. Log for trend analysis."
        else:
            return "LOW: Record only. No immediate action required."
    
    def get_status(self) -> Dict:
        """Get agent status"""
        return {
            "name": self.name,
            "description": self.description,
            "tools_count": len(self.tools),
            "memory_entries": len(self.memory.entries),
            "execution_history_count": len(self.execution_history),
            "llm_configured": self.llm is not None
        }

# ============================================================
# Tool Builders (for common NSP operations)
# ============================================================

class NSPToolBuilder:
    """Builder for National Security Platform tools"""
    
    @staticmethod
    def create_nlp_analyze_tool(nlp_analyzer) -> Tool:
        """Create tool for NLP alert analysis"""
        async def handler(description: str) -> ToolResult:
            try:
                result = nlp_analyzer.analyze_alert(description)
                return ToolResult(
                    status=ToolResultStatus.SUCCESS,
                    data=result
                )
            except Exception as e:
                return ToolResult(
                    status=ToolResultStatus.ERROR,
                    data=None,
                    error=str(e)
                )
        
        return Tool(
            name="nsp_analyze_alert",
            description="Analyze alert description using NLP to extract entities, urgency, and keywords",
            parameters={
                "description": {"type": "string", "description": "Alert description text"}
            },
            handler=handler,
            category="intelligence"
        )
    
    @staticmethod
    def create_llm_deep_analyze_tool(llm_provider) -> Tool:
        """Create tool for LLM deep analysis"""
        async def handler(description: str) -> ToolResult:
            try:
                result = await llm_provider.analyze(
                    description,
                    system_prompt="You are a deep analyst for national security. Provide refined intelligence."
                )
                return ToolResult(
                    status=ToolResultStatus.SUCCESS,
                    data=result
                )
            except Exception as e:
                return ToolResult(
                    status=ToolResultStatus.ERROR,
                    data=None,
                    error=str(e)
                )
        
        return Tool(
            name="nsp_llm_deep_analyze",
            description="Perform deep LLM-based analysis for threat assessment",
            parameters={
                "description": {"type": "string", "description": "Alert or intelligence description"}
            },
            handler=handler,
            category="intelligence"
        )
    
    @staticmethod
    def create_database_tool(db_pool) -> Tool:
        """Create tool for database operations"""
        async def handler(operation: str, query: str, params: List = None) -> ToolResult:
            if not db_pool:
                return ToolResult(
                    status=ToolResultStatus.ERROR,
                    data=None,
                    error="Database not connected"
                )
            
            try:
                async with db_pool.acquire() as conn:
                    if operation == "select":
                        result = await conn.fetch(query, *(params or []))
                        return ToolResult(
                            status=ToolResultStatus.SUCCESS,
                            data=[dict(r) for r in result]
                        )
                    elif operation == "execute":
                        await conn.execute(query, *(params or []))
                        return ToolResult(
                            status=ToolResultStatus.SUCCESS,
                            data={"affected_rows": "success"}
                        )
                    else:
                        return ToolResult(
                            status=ToolResultStatus.ERROR,
                            data=None,
                            error=f"Unknown operation: {operation}"
                        )
            except Exception as e:
                return ToolResult(
                    status=ToolResultStatus.ERROR,
                    data=None,
                    error=str(e)
                )
        
        return Tool(
            name="nsp_database",
            description="Execute database operations for alerts, agencies, or intelligence",
            parameters={
                "operation": {"type": "string", "enum": ["select", "execute"]},
                "query": {"type": "string", "description": "SQL query"},
                "params": {"type": "array", "description": "Query parameters"}
            },
            handler=handler,
            category="storage"
        )
    
    @staticmethod
    def create_nats_publish_tool(nc) -> Tool:
        """Create tool for NATS message publishing"""
        async def handler(subject: str, message: Dict) -> ToolResult:
            if not nc:
                return ToolResult(
                    status=ToolResultStatus.ERROR,
                    data=None,
                    error="NATS not connected"
                )
            
            try:
                js = nc.jetstream()
                await js.publish(subject, json.dumps(message).encode())
                return ToolResult(
                    status=ToolResultStatus.SUCCESS,
                    data={"subject": subject, "status": "published"}
                )
            except Exception as e:
                return ToolResult(
                    status=ToolResultStatus.ERROR,
                    data=None,
                    error=str(e)
                )
        
        return Tool(
            name="nsp_publish",
            description="Publish message to NATS subject for inter-service communication",
            parameters={
                "subject": {"type": "string", "description": "NATS subject"},
                "message": {"type": "object", "description": "Message payload"}
            },
            handler=handler,
            category="messaging"
        )


# ============================================================
# Pre-built Agent Templates
# ============================================================

class OpenClawAgents:
    """Factory for common NSP agent types"""
    
    @staticmethod
    def create_threat_analyzer(llm_provider, nlp_analyzer, db_pool = None) -> OpenClawAgent:
        """Create a threat analysis agent with full tool chain"""
        tools = [
            NSPToolBuilder.create_nlp_analyze_tool(nlp_analyzer),
            NSPToolBuilder.create_llm_deep_analyze_tool(llm_provider),
        ]
        
        if db_pool:
            tools.append(NSPToolBuilder.create_database_tool(db_pool))
        
        agent = OpenClawAgent(
            name="ThreatAnalyzer",
            description="Analyzes incoming alerts for threat assessment using NLP and LLM",
            llm_provider=llm_provider,
            tools=tools,
            max_memory_entries=200,
            system_prompt="""You are the Threat Analyzer agent for the National Security Platform.
Your role is to assess incoming alerts and determine:
1. Threat severity (0.0 - 1.0)
2. Threat type (crime, terrorism, civil unrest, etc.)
3. Recommended response tier
4. Key entities involved

Always provide evidence-based assessments."""
        )
        
        return agent
    
    @staticmethod
    def create_dispatch_agent(llm_provider, nats_client = None) -> OpenClawAgent:
        """Create a dispatch coordination agent"""
        tools = []
        
        if nats_client:
            tools.append(NSPToolBuilder.create_nats_publish_tool(nats_client))
        
        agent = OpenClawAgent(
            name="DispatchCoordinator",
            description="Coordinates tactical response deployment based on threat assessment",
            llm_provider=llm_provider,
            tools=tools,
            max_memory_entries=150,
            system_prompt="""You are the Dispatch Coordinator for the National Security Platform.
Your role is to recommend appropriate tactical responses:
1. Which agencies to notify
2. What assets to deploy
3. Priority level
4. Coordination requirements

Prioritize speed and effectiveness while ensuring proper authorization."""
        )
        
        return agent
    
    @staticmethod
    def create_intelligence_correlator(llm_provider, db_pool = None) -> OpenClawAgent:
        """Create an intelligence correlation agent"""
        tools = []
        
        if db_pool:
            tools.append(NSPToolBuilder.create_database_tool(db_pool))
        
        agent = OpenClawAgent(
            name="IntelligenceCorrelator",
            description="Correlates new intelligence with historical patterns",
            llm_provider=llm_provider,
            tools=tools,
            max_memory_entries=500,
            system_prompt="""You are the Intelligence Correlator for the National Security Platform.
Your role is to identify patterns across multiple alerts and intelligence sources:
1. Link related incidents
2. Identify recurring threats
3. Detect emerging patterns
4. Generate threat predictions

Use historical data to provide context and predictions."""
        )
        
        return agent


# ============================================================
# Chain Definitions (pre-defined workflows)
# ============================================================

class NSPChains:
    """Pre-defined analysis chains for common NSP workflows"""
    
    @staticmethod
    def full_threat_assessment() -> List[Dict]:
        """
        Full threat assessment chain:
        1. NLP analysis (fast)
        2. LLM deep analysis (if needed)
        3. Database lookup for related alerts
        4. Correlation with historical patterns
        """
        return [
            {
                "tool": "nsp_analyze_alert",
                "params": {"description": "$input:description"},
                "continue_on_error": False
            },
            {
                "tool": "nsp_llm_deep_analyze",
                "params": {"description": "$input:description"},
                "continue_on_error": True  # Continue even if LLM fails
            },
            {
                "tool": "nsp_database",
                "params": {
                    "operation": "select",
                    "query": "SELECT * FROM alerts WHERE created_at > NOW() - INTERVAL '24 hours' ORDER BY severity_score DESC LIMIT 10"
                },
                "continue_on_error": True
            }
        ]
    
    @staticmethod
    def rapid_triage() -> List[Dict]:
        """Quick triage chain for high-volume processing"""
        return [
            {
                "tool": "nsp_analyze_alert",
                "params": {"description": "$input:description"}
            }
        ]
