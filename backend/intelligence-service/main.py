import asyncio
import os
import json
import logging
import asyncpg
from fastapi import FastAPI, Response
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, Counter, Gauge
from nats.aio.client import Client as NATS
import uvicorn
import grpc_server

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("INTELLIGENCE_SERVICE")

# OpenTelemetry Setup
resource = Resource.create({"service.name": "intelligence-service"})
provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://jaeger:4317"), insecure=True))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

app = FastAPI(title="National Security Intelligence Service")
FastAPIInstrumentor.instrument_app(app)

NATS_URL = os.getenv("NATS_URL", "nats://nats:4222")

@app.on_event("startup")
async def startup_event():
    # Initialize database pool
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        logger.error("❌ DATABASE_URL not set. Database integration disabled.")
    else:
        try:
            app.state.db_pool = await asyncpg.create_pool(database_url)
            logger.info("✅ Connected to CockroachDB")
        except Exception as e:
            logger.error(f"❌ Failed to connect to database: {e}")

    # Start NATS listener in the background
    asyncio.create_task(run_nats_listener())
    # Start gRPC server
    db_pool = getattr(app.state, 'db_pool', None)
    app.state.grpc_server = await grpc_server.serve(db_pool=db_pool)

@app.on_event("shutdown")
async def shutdown_event():
    if hasattr(app.state, 'db_pool'):
        await app.state.db_pool.close()
    if hasattr(app.state, 'grpc_server'):
        await app.state.grpc_server.stop(0)

async def run_nats_listener():
    nc = NATS()
    try:
        await nc.connect(NATS_URL)
        js = nc.jetstream()

        # Create a pull subscription
        # Stream 'ALERTS' is created by the Go service on startup
        psub = await js.pull_subscribe("alerts.new", "intelligence-service-worker")

        logger.info(f"🚀 NATS Intelligence Worker started. Listening on alerts.new")

        while True:
            try:
                msgs = await psub.fetch(batch=5, timeout=10)
                for msg in msgs:
                    alert_data = json.loads(msg.data.decode())
                    logger.info(f"🔍 Analyzing Alert: {alert_data.get('id')} type: {alert_data.get('alert_type')}")
                    
                    # Simulate AI Analysis
                    await analyze_alert(alert_data)
                    
                    await msg.ack()
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error processing messages: {e}")
                await asyncio.sleep(1)

    except Exception as e:
        logger.error(f"Failed to connect to NATS: {e}")

from nlp_analyzer import analyze_alert_description, deep_analyze
from llm_provider import get_llm_provider
from agents import CrisisAgent, DispatchAgent, SentinelAnalyst, SysAdminSentinel

# ... (rest of imports)

# Initialize Agent Stacks
llm = get_llm_provider()
crisis_agent = CrisisAgent(llm) if llm else None
dispatch_agent = DispatchAgent(llm) if llm else None
sentinel_analyst = SentinelAnalyst(llm) if llm else None
sysadmin_sentinel = SysAdminSentinel(llm) if llm else None

async def analyze_alert(alert_data):
    # Tier 1: Fast AI Analysis using spaCy
    content = alert_data.get('content_text', "")
    alert_id = alert_data.get('id')
    
    if not content:
        logger.warning(f"Empty content for alert {alert_id}, skipping detailed NLP.")
        return

    # Use the fast NLP analyzer (spaCy) - Local & Instant
    analysis = analyze_alert_description(content)
    
    urgency_map = {'critical': 0.95, 'high': 0.75, 'medium': 0.5, 'low': 0.2}
    severity_score = urgency_map.get(analysis.get('urgency_level', 'low'), 0.1)
    
    # Flatten entities into risk_keywords
    risk_keywords = analysis.get('keywords', [])
    entities = analysis.get('entities', {})
    
    for key, items in entities.items():
        if key == 'other': continue
        for item in items:
            risk_keywords.append(f"{key.upper()}:{item}")

    logger.info(f"✅ Tier 1 Analysis (spaCy) complete for Alert {alert_id}: Score={severity_score}")
    
    # Initial Database Update (Fast Path)
    await update_alert_metadata(alert_id, severity_score, risk_keywords)

    # Tier 2 & 3: Specialized Agent Review (Background/Async)
    if llm:
        asyncio.create_task(run_agent_review(alert_data, analysis))

async def run_agent_review(alert_data: Dict, tier1_analysis: Dict):
    """Run specialized agents in the background to avoid blocking the NATS listener"""
    alert_id = alert_data.get('id')
    content = alert_data.get('content_text', "")

    try:
        # LLM Deep Analysis
        deep_res = await deep_analyze(content)
        if deep_res and 'refined_severity' in deep_res:
            logger.info(f"🤖 Tier 2 (LLM) refined Alert {alert_id} severity to {deep_res['refined_severity']}")
            # Optional: trigger re-dispatch if severity jumps significantly

        # Crisis Agent (Option 1)
        if crisis_agent:
            broadcast = await crisis_agent.generate_broadcast(alert_data, tier1_analysis)
            if broadcast:
                logger.info(f"📢 CrisisAgent: Broadcast generated for Alert {alert_id}")
                # Future: Push to Push Notification service

        # Dispatch Agent (Option 2)
        if dispatch_agent:
            suggestion = await dispatch_agent.suggest_deployment(alert_data, tier1_analysis)
            if suggestion:
                logger.info(f"🚁 DispatchAgent: Tactical suggestion for Alert {alert_id}: {suggestion.get('recommended_asset_types')}")

        # Sentinel Analyst (Option 3A)
        if sentinel_analyst:
            # We would typically pass historical context here
            correlation = await sentinel_analyst.correlate_threat(alert_data)
            if correlation:
                logger.info(f"📊 SentinelAnalyst: Threat correlation score for Alert {alert_id}: {correlation.get('correlation_score')}")

    except Exception as e:
        logger.error(f"Error in Multi-Agent review for Alert {alert_id}: {e}")

async def update_alert_metadata(alert_id, severity_score, risk_keywords):
    if hasattr(app.state, 'db_pool'):
        try:
            async with app.state.db_pool.acquire() as conn:
                await conn.execute(
                    "UPDATE alerts SET severity_score = $1, risk_keywords = $2 WHERE id = $3",
                    severity_score, risk_keywords, alert_id
                )
                logger.info(f"💾 Updated alert {alert_id} metadata.")
        except Exception as e:
            logger.error(f"❌ Database error updating alert {alert_id}: {e}")

@app.get("/")
def read_root():
    return {"status": "active", "service": "Intelligence Service (Python)"}

@app.get("/health")
async def health_check():
    status = "OPERATIONAL"
    dependencies = {}
    
    # 1. Check Database
    if hasattr(app.state, 'db_pool'):
        try:
            async with app.state.db_pool.acquire() as conn:
                await conn.execute("SELECT 1")
                dependencies["database"] = "OPERATIONAL"
        except Exception:
            dependencies["database"] = "OFFLINE"
            status = "DEGRADED"
    else:
        dependencies["database"] = "DISABLED"
        status = "DEGRADED"

    # 2. Check model (spaCy)
    from nlp_analyzer import analyzer
    if analyzer and analyzer.nlp:
        dependencies["nlp_model"] = "LOADED"
    else:
        dependencies["nlp_model"] = "ERROR"
        status = "DEGRADED"

    return {
        "status": status,
        "service": "intelligence-service",
        "dependencies": dependencies
    }

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
