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

from nlp_analyzer import analyze_alert_description

# ... (rest of imports)

async def analyze_alert(alert_data):
    # AI Analysis logic using spaCy NLP Analyzer
    content = alert_data.get('content_text', "")
    alert_id = alert_data.get('id')
    
    if not content:
        logger.warning(f"Empty content for alert {alert_id}, skipping detailed NLP.")
        return

    # Use the advanced NLP analyzer
    analysis = analyze_alert_description(content)
    
    severity_score = analysis.get('urgency_level_score', 0.1)
    # Map urgency string to score if needed
    urgency_map = {'critical': 0.95, 'high': 0.75, 'medium': 0.5, 'low': 0.2}
    if 'urgency_level' in analysis:
        severity_score = urgency_map.get(analysis['urgency_level'], 0.1)
    
    # Flatten entities into prefixed risk_keywords
    risk_keywords = analysis.get('keywords', [])
    entities = analysis.get('entities', {})
    
    for person in entities.get('people', []):
        risk_keywords.append(f"PERSON:{person}")
    for location in entities.get('locations', []):
        risk_keywords.append(f"LOC:{location}")
    for vehicle in entities.get('vehicles', []):
        risk_keywords.append(f"VEHICLE:{vehicle}")
    for weapon in entities.get('weapons', []):
        risk_keywords.append(f"WEAPON:{weapon}")
    for org in entities.get('organizations', []):
        risk_keywords.append(f"ORG:{org}")

    logger.info(f"✅ AI Analysis complete for Alert {alert_id}: Score={severity_score}, Keywords={len(risk_keywords)}")
    
    # Update database
    if hasattr(app.state, 'db_pool'):
        try:
            async with app.state.db_pool.acquire() as conn:
                await conn.execute(
                    "UPDATE alerts SET severity_score = $1, risk_keywords = $2 WHERE id = $3",
                    severity_score, risk_keywords, alert_id
                )
                logger.info(f"💾 Updated alert {alert_id} in database with enriched metadata.")
        except Exception as e:
            logger.error(f"❌ Failed to update alert in database: {e}")
    else:
        logger.warning("⚠️ Database pool not available, skipping update.")

    logger.info(f"✅ AI Analysis complete for Alert {alert_id}: Score={severity_score}, Keywords={risk_keywords}")
    
    # Update database
    if hasattr(app.state, 'db_pool'):
        try:
            async with app.state.db_pool.acquire() as conn:
                await conn.execute(
                    "UPDATE alerts SET severity_score = $1, risk_keywords = $2 WHERE id = $3",
                    severity_score, risk_keywords, alert_id
                )
                logger.info(f"💾 Updated alert {alert_id} in database.")
        except Exception as e:
            logger.error(f"❌ Failed to update alert in database: {e}")
    else:
        logger.warning("⚠️ Database pool not available, skipping update.")

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
