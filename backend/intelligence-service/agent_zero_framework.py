"""
Agent Zero Framework Integration for National Security Platform

This module provides Agent Zero-compatible agent framework with:
- Lightweight, adaptable architecture
- Memory-augmented intelligence with session persistence
- Customizable prompts for agency-specific needs
- Flexible tool integration

Based on Agent Zero architecture principles adapted for NSP use cases.
"""
import asyncio
import logging
import json
import hashlib
from typing import Dict, List, Any, Optional, Callable, Awaitable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid

logger = logging.getLogger("agent_zero")

# ============================================================
# Flexible Tool Interface
# ============================================================

class ZeroToolInterface:
    """
    Lightweight tool interface for Agent Zero.
    Simpler than OpenClaw - more flexible and adaptable.
    """
    
    def __init__(
        self,
        name: str,
        func: Callable,
        description: str = "",
        input_schema: Dict = None,
        output_schema: Dict = None,
        metadata: Dict = None
    ):
        self.name = name
        self.func = func
        self.description = description
        self.input_schema = input_schema or {}
        self.output_schema = output_schema or {}
        self.metadata = metadata or {}
        self.call_count = 0
        self.total_time_ms = 0.0
    
    async def execute(self, **kwargs) -> Any:
        """Execute the tool function"""
        import time
        start = time.time()
        
        try:
            if asyncio.iscoroutinefunction(self.func):
                result = await self.func(**kwargs)
            else:
                result = self.func(**kwargs)
            
            self.call_count += 1
            self.total_time_ms += (time.time() - start) * 1000
            
            return {
                "success": True,
                "result": result,
                "tool": self.name,
                "execution_time_ms": (time.time() - start) * 1000
            }
        except Exception as e:
            logger.error(f"Tool {self.name} error: {e}")
            return {
                "success": False,
                "error": str(e),
                "tool": self.name,
                "execution_time_ms": (time.time() - start) * 1000
            }
    
    def get_stats(self) -> Dict:
        return {
            "name": self.name,
            "calls": self.call_count,
            "avg_time_ms": self.total_time_ms / max(self.call_count, 1)
        }


# ============================================================
# Adaptive Memory System (Agent Zero Style)
# ============================================================

@dataclass
class MemoryBlock:
    """Single memory block with importance scoring"""
    id: str
    content: Any
    created_at: datetime
    last_accessed: datetime
    access_count: int = 0
    importance: float = 0.5
    embedding: List[float] = None  # For semantic search
    context: Dict = field(default_factory=dict)

class AdaptiveMemory:
    """
    Agent Zero-style adaptive memory system.
    - Automatic importance adjustment based on access patterns
    - Semantic-like search without embeddings (keyword-based)
    - Session persistence capabilities
    - Context-aware retrieval
    """
    
    def __init__(
        self,
        name: str,
        max_blocks: int = 200,
        importance_decay: float = 0.95,
        min_importance: float = 0.1
    ):
        self.name = name
        self.max_blocks = max_blocks
        self.importance_decay = importance_decay
        self.min_importance = min_importance
        self.blocks: Dict[str, MemoryBlock] = {}
        self.access_log: List[Dict] = []
    
    def store(
        self,
        content: Any,
        importance: float = 0.5,
        context: Dict = None,
        block_id: str = None
    ) -> str:
        """Store a new memory block"""
        block_id = block_id or str(uuid.uuid4())
        
        block = MemoryBlock(
            id=block_id,
            content=content,
            created_at=datetime.utcnow(),
            last_accessed=datetime.utcnow(),
            importance=importance,
            context=context or {}
        )
        
        self.blocks[block_id] = block
        
        # Prune if over capacity
        if len(self.blocks) > self.max_blocks:
            self._prune()
        
        logger.debug(f"💾 Memory stored: {block_id} (importance: {importance})")
        return block_id
    
    def retrieve(self, block_id: str) -> Optional[MemoryBlock]:
        """Retrieve a specific memory block"""
        if block_id in self.blocks:
            block = self.blocks[block_id]
            block.access_count += 1
            block.last_accessed = datetime.utcnow()
            
            # Boost importance on access
            block.importance = min(1.0, block.importance * 1.1)
            
            self.access_log.append({
                "block_id": block_id,
                "action": "retrieve",
                "timestamp": datetime.utcnow()
            })
            
            return block
        return None
    
    def search(
        self,
        keywords: List[str] = None,
        context_filter: Dict = None,
        time_range: timedelta = None,
        min_importance: float = 0.0,
        limit: int = 10
    ) -> List[MemoryBlock]:
        """
        Search memories by keywords, context, time, or importance.
        """
        results = []
        
        for block in self.blocks.values():
            # Check importance threshold
            if block.importance < min_importance:
                continue
            
            # Check time range
            if time_range:
                cutoff = datetime.utcnow() - time_range
                if block.created_at < cutoff:
                    continue
            
            # Check context filter
            if context_filter:
                if not all(block.context.get(k) == v for k, v in context_filter.items()):
                    continue
            
            # Check keywords (simple text search)
            if keywords:
                text = json.dumps(block.content).lower()
                if not any(kw.lower() in text for kw in keywords):
                    continue
            
            results.append(block)
        
        # Sort by importance and recency
        results.sort(
            key=lambda b: (b.importance, b.last_accessed),
            reverse=True
        )
        
        return results[:limit]
    
    def recall_related(self, query: str, limit: int = 5) -> List[MemoryBlock]:
        """Recall memories related to a query (keyword-based)"""
        keywords = query.lower().split()
        return self.search(keywords=keywords, limit=limit)
    
    def get_context_window(self, hours: int = 24) -> List[MemoryBlock]:
        """Get recent memories within time window"""
        return self.search(time_range=timedelta(hours=hours), limit=20)
    
    def _prune(self):
        """Remove least important memories when at capacity"""
        # Sort by importance
        sorted_blocks = sorted(
            self.blocks.values(),
            key=lambda b: b.importance
        )
        
        # Remove bottom 20%
        prune_count = max(1, len(sorted_blocks) // 5)
        for block in sorted_blocks[:prune_count]:
            del self.blocks[block.id]
            logger.debug(f"🗑️ Pruned memory: {block.id}")
    
    def summarize(self) -> Dict:
        """Get memory summary"""
        return {
            "total_blocks": len(self.blocks),
            "avg_importance": sum(b.importance for b in self.blocks.values()) / max(len(self.blocks), 1),
            "total_accesses": sum(b.access_count for b in self.blocks.values()),
            "oldest_block": min(b.created_at for b in self.blocks.values()) if self.blocks else None,
            "newest_block": max(b.created_at for b in self.blocks.values()) if self.blocks else None
        }
    
    def clear(self):
        """Clear all memories"""
        self.blocks.clear()
        self.access_log.clear()


# ============================================================
# Agent Zero Base Agent
# ============================================================

class AgentZero:
    """
    Lightweight, adaptable Agent Zero-style agent.
    
    Key differences from OpenClaw:
    - More minimalist, flexible design
    - Adaptive memory with automatic importance adjustment
    - Easier to customize prompts at runtime
    - Simpler tool interface
    """
    
    def __init__(
        self,
        name: str,
        role: str,
        llm_provider: Any = None,
        tools: List[ZeroToolInterface] = None,
        max_memory: int = 200,
        custom_prompt: str = None
    ):
        self.name = name
        self.role = role
        self.llm = llm_provider
        self.tools: Dict[str, ZeroToolInterface] = {t.name: t for t in (tools or [])}
        self.memory = AdaptiveMemory(name=name, max_blocks=max_memory)
        
        # Prompt templates (easily customizable)
        self.system_template = custom_prompt or self._default_prompt()
        self.current_context: Dict = {}
        
        logger.info(f"🔷 Initialized Agent Zero: {name} ({role})")
    
    def _default_prompt(self) -> str:
        return f"""You are {self.name}, a {self.role} for the National Security Platform.
You have access to tools and a memory system that stores important context.
Always provide accurate, actionable responses based on your training and available data.

Your responses should be:
- Concise and actionable
- Security-focused
- Appropriate for escalation when needed"""

    def add_tool(self, tool: ZeroToolInterface):
        """Add a tool to the agent"""
        self.tools[tool.name] = tool
        logger.info(f"🔌 Tool added to {self.name}: {tool.name}")
    
    async def call_tool(self, tool_name: str, **kwargs) -> Dict:
        """Call a tool by name"""
        if tool_name not in self.tools:
            return {"success": False, "error": f"Tool {tool_name} not found"}
        
        tool = self.tools[tool_name]
        result = await tool.execute(**kwargs)
        
        # Store tool call in memory
        self.memory.store(
            content={
                "tool": tool_name,
                "input": kwargs,
                "output": result
            },
            importance=0.6,
            context={"type": "tool_call", "tool": tool_name}
        )
        
        return result
    
    def remember(
        self,
        content: Any,
        importance: float = 0.5,
        context: Dict = None
    ) -> str:
        """Store something in memory"""
        return self.memory.store(content, importance, context)
    
    def recall(
        self,
        query: str = None,
        keywords: List[str] = None,
        context: Dict = None,
        hours: int = None
    ) -> List[MemoryBlock]:
        """Recall memories"""
        if query:
            return self.memory.recall_related(query)
        elif keywords:
            return self.memory.search(keywords=keywords)
        elif context:
            return self.memory.search(context_filter=context)
        elif hours:
            return self.memory.get_context_window(hours)
        else:
            # Return recent
            return self.memory.get_context_window(hours=24)
    
    async def think(
        self,
        prompt: str,
        use_memory: bool = True,
        memory_window_hours: int = 24
    ) -> str:
        """
        Process a prompt using LLM with optional memory context.
        """
        context_parts = []
        
        # Include relevant memories
        if use_memory:
            relevant = self.memory.recall_related(prompt, limit=5)
            if relevant:
                context_parts.append("Relevant memories:")
                for mem in relevant:
                    context_parts.append(f"- {json.dumps(mem.content)}")
        
        # Include recent context
        recent = self.memory.get_context_window(hours=memory_window_hours)
        if recent:
            context_parts.append(f"\nRecent events ({memory_window_hours}h window):")
            for mem in recent[-3:]:
                context_parts.append(f"- {json.dumps(mem.content)[:200]}")
        
        full_prompt = f"""{self.system_template}

Current context:
{chr(10).join(context_parts)}

User query: {prompt}

Provide your analysis and recommendation:"""

        if not self.llm:
            return self._fallback_think(prompt)
        
        try:
            response = await self.llm.analyze(
                full_prompt,
                system_prompt=self.system_template
            )
            
            # Store the thinking process
            self.memory.store(
                content={
                    "prompt": prompt,
                    "response": response
                },
                importance=0.7,
                context={"type": "thought_process"}
            )
            
            return response
        except Exception as e:
            logger.error(f"LLM think error: {e}")
            return self._fallback_think(prompt)
    
    def _fallback_think(self, prompt: str) -> str:
        """Fallback reasoning without LLM"""
        # Check memory for relevant context
        relevant = self.memory.recall_related(prompt, limit=3)
        
        if relevant:
            context = "\n".join(f"- {r.content}" for r in relevant)
            return f"Based on memory context:\n{context}\n\nRecommendation: Review related cases and escalate if pattern detected."
        
        return "Insufficient context for analysis. Consider gathering more intelligence."
    
    async def execute_workflow(
        self,
        steps: List[Dict],
        initial_input: Dict = None
    ) -> List[Dict]:
        """
        Execute a flexible workflow.
        
        Steps format:
        [
            {"tool": "tool_name", "input": {...}},
            {"think": "prompt with $prev references"},
            {"remember": {"content": ..., "importance": 0.5}}
        ]
        """
        results = []
        context = initial_input or {}
        
        for i, step in enumerate(steps):
            step_result = {"step": i, "type": step.get("type", "unknown")}
            
            if "tool" in step:
                # Resolve $prev references
                input_data = self._resolve_input(step.get("input", {}), context)
                tool_result = await self.call_tool(step["tool"], **input_data)
                step_result["result"] = tool_result
                context[step["tool"]] = tool_result
            
            elif "think" in step:
                # Think step
                prompt = self._resolve_template(step["think"], context)
                thought = await self.think(prompt, use_memory=True)
                step_result["result"] = thought
                context["thought"] = thought
            
            elif "remember" in step:
                # Remember step
                mem_content = self._resolve_input(step["remember"].get("content", {}), context)
                importance = step["remember"].get("importance", 0.5)
                block_id = self.remember(mem_content, importance)
                step_result["result"] = {"stored": block_id}
            
            elif "condition" in step:
                # Conditional branch
                condition = self._evaluate_condition(step["condition"], context)
                step_result["result"] = {"branch_taken": "true" if condition else "false"}
                if not condition and "else" in step:
                    # Execute else branch
                    else_results = await self.execute_workflow(step["else"], context)
                    step_result["else_results"] = else_results
            
            results.append(step_result)
        
        return results
    
    def _resolve_input(self, input_data: Any, context: Dict) -> Any:
        """Resolve input references like $prev"""
        if isinstance(input_data, dict):
            resolved = {}
            for k, v in input_data.items():
                if isinstance(v, str) and v.startswith("$prev:"):
                    ref = v.split(":", 1)[1]
                    resolved[k] = context.get(ref, {}).get("result", v)
                else:
                    resolved[k] = v
            return resolved
        return input_data
    
    def _resolve_template(self, template: str, context: Dict) -> str:
        """Resolve template variables"""
        result = template
        for key, value in context.items():
            if isinstance(value, dict):
                value = json.dumps(value.get("result", value))
            result = result.replace(f"$prev:{key}", str(value))
        return result
    
    def _evaluate_condition(self, condition: Dict, context: Dict) -> bool:
        """Evaluate a condition"""
        # Simple condition evaluation
        if "exists" in condition:
            return condition["exists"] in context
        if "equals" in condition:
            return context.get(condition["equals"]["field"]) == condition["equals"]["value"]
        return True
    
    def get_status(self) -> Dict:
        """Get agent status"""
        return {
            "name": self.name,
            "role": self.role,
            "tools": list(self.tools.keys()),
            "memory_summary": self.memory.summarize(),
            "llm_configured": self.llm is not None
        }


# ============================================================
# Agent Zero Factory
# ============================================================

class ZeroAgents:
    """Factory for Agent Zero-style agents"""
    
    @staticmethod
    def create_field_agent(
        name: str,
        llm_provider: Any = None,
        tools: List[ZeroToolInterface] = None
    ) -> AgentZero:
        """
        Create a field agent for mobile/remote operations.
        Optimized for low bandwidth and intermittent connectivity.
        """
        agent = AgentZero(
            name=name,
            role="Field Intelligence Officer",
            llm_provider=llm_provider,
            tools=tools,
            max_memory=100,  # Smaller for field use
            custom_prompt=f"""You are {name}, a field intelligence officer for the National Security Platform.
You operate in dynamic, often low-connectivity environments.
Your role:
- Gather and report field intelligence
- Make rapid assessments with limited information
- Escalate critical threats immediately
- Maintain situational awareness

Prioritize:
1. Speed over completeness when needed
2. Accurate threat classification
3. Clear, actionable recommendations
4. Security of yourself and your team"""
        )
        return agent
    
    @staticmethod
    def create_analyst_agent(
        name: str,
        llm_provider: Any = None,
        tools: List[ZeroToolInterface] = None
    ) -> AgentZero:
        """
        Create an intelligence analyst agent.
        Optimized for deep analysis and pattern recognition.
        """
        agent = AgentZero(
            name=name,
            role="Senior Intelligence Analyst",
            llm_provider=llm_provider,
            tools=tools,
            max_memory=300,  # Larger for analysis
            custom_prompt=f"""You are {name}, a senior intelligence analyst for the National Security Platform.
Your role:
- Analyze complex intelligence data
- Identify patterns and correlations
- Produce actionable intelligence reports
- Support strategic decision-making

Prioritize:
1. Accuracy and completeness
2. Evidence-based conclusions
3. Contextual awareness
4. Appropriate classification"""
        )
        return agent
    
    @staticmethod
    def create_coordinator_agent(
        name: str,
        llm_provider: Any = None,
        tools: List[ZeroToolInterface] = None
    ) -> AgentZero:
        """
        Create a coordination agent.
        Optimized for multi-agency coordination and resource allocation.
        """
        agent = AgentZero(
            name=name,
            role="Operations Coordinator",
            llm_provider=llm_provider,
            tools=tools,
            max_memory=200,
            custom_prompt=f"""You are {name}, an operations coordinator for the National Security Platform.
Your role:
- Coordinate multi-agency responses
- Allocate resources effectively
- Maintain operational awareness
- Ensure proper escalation

Prioritize:
1. Efficient resource utilization
2. Clear communication
3. Appropriate escalation
4. Operational security"""
        )
        return agent


# ============================================================
# Example Workflows
# ============================================================

class ZeroWorkflows:
    """Pre-built workflows for Agent Zero agents"""
    
    @staticmethod
    def field_report_analysis() -> List[Dict]:
        """Analyze a field report"""
        return [
            {
                "tool": "nlp_analyze",
                "input": {"text": "$prev:report_text"}
            },
            {
                "think": "Analyze this field report: $prev:nlp_analyze. What are the key threats? Should this be escalated?"
            },
            {
                "remember": {
                    "content": {"$prev:report_text": "$prev:report_text", "analysis": "$prev:thought"},
                    "importance": 0.7,
                    "context": {"type": "field_report"}
                }
            }
        ]
    
    @staticmethod
    def threat_correlation(new_incident: Dict) -> List[Dict]:
        """Correlate new incident with historical data"""
        return [
            {
                "remember": {
                    "content": new_incident,
                    "importance": 0.8,
                    "context": {"type": "incident"}
                }
            },
            {
                "think": f"Search memory for related incidents to: {json.dumps(new_incident)}"
            },
            {
                "think": "Based on related incidents found in memory, what is the threat correlation score? Provide 0-1 scale."
            }
        ]
    
    @staticmethod
    def alert_triage(alert: Dict) -> List[Dict]:
        """Quick alert triage workflow"""
        return [
            {
                "tool": "nlp_analyze",
                "input": {"text": alert.get("content_text", "")}
            },
            {
                "condition": {
                    "equals": {
                        "field": "$prev:nlp_analyze.urgency_level",
                        "value": "critical"
                    }
                }
            },
            # If critical - immediate escalation
            {
                "think": "CRITICAL ALERT DETECTED. Immediate escalation required. Generate emergency notification."
            },
            {
                "tool": "send_notification",
                "input": {"level": "critical", "alert": alert}
            }
        ]
