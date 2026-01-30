import asyncio
import os
import json
import logging
import asyncpg
from fastapi import FastAPI
from nats.aio.client import Client as NATS
import grpc_server

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("intelligence-service")

app = FastAPI(title="National Security Intelligence Service")

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

async def analyze_alert(alert_data):
    # AI Analysis logic
    content = alert_data.get('content_text', "").lower()
    alert_id = alert_data.get('id')
    
    severity_score = 0.1
    risk_keywords = []
    
    # Critical keywords
    critical_terms = ['gunshot', 'bomb', 'explosion', 'fire', 'terrorist', 'attack', 'kidnap', 'emergency']
    # High risk keywords
    high_risk_terms = ['suspicious', 'threat', 'fighting', 'robbery', 'riot', 'protest']
    
    for term in critical_terms:
        if term in content:
            severity_score = max(severity_score, 0.95)
            risk_keywords.append(term)
            
    for term in high_risk_terms:
        if term in content:
            severity_score = max(severity_score, 0.75)
            risk_keywords.append(term)
            
    if not risk_keywords and content:
        severity_score = 0.3 # Default for non-empty content
        risk_keywords = ["general_alert"]

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
def health_check():
    return {"status": "ok"}
