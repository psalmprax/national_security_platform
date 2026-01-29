import asyncio
import os
import json
import logging
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
    # Start NATS listener in the background
    asyncio.create_task(run_nats_listener())
    # Start gRPC server in a separate thread (or just run it)
    # Since gRPC's server.start() is non-blocking, we can just call it
    app.state.grpc_server = grpc_server.serve()

@app.on_event("shutdown")
async def shutdown_event():
    if hasattr(app.state, 'grpc_server'):
        app.state.grpc_server.stop(0)

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
    # Mock AI analysis: scoring and tagging
    logger.info(f"✅ AI Analysis complete for Alert {alert_data.get('id')}")
    # TODO: Update database with severity_score and risk_keywords using shared postgres pool

@app.get("/")
def read_root():
    return {"status": "active", "service": "Intelligence Service (Python)"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
