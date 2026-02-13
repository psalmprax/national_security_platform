import grpc
import logging
import sys
import os
import asyncio

# Add the backend directory to sys.path to import generated stubs
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

import national_security_pb2
import national_security_pb2_grpc
from nlp_analyzer import analyze_alert_description

logger = logging.getLogger("intelligence-service-grpc")

class IntelligenceServiceServicer(national_security_pb2_grpc.IntelligenceServiceServicer):
    def __init__(self, db_pool=None):
        self.db_pool = db_pool

    async def AnalyzeAlert(self, request, context):
        logger.info(f"Received gRPC AnalyzeAlert request for ID: {request.alert_id}")
        
        content = request.content_text
        if not content:
            return national_security_pb2.AnalyzeResponse(
                alert_id=request.alert_id,
                severity_score=0.1,
                risk_keywords=[],
                english_translation="",
                category="general"
            )

        # Use the advanced NLP analyzer
        analysis = analyze_alert_description(content)
        
        severity = 0.2
        urgency_map = {'critical': 0.95, 'high': 0.75, 'medium': 0.5, 'low': 0.2}
        if 'urgency_level' in analysis:
            severity = urgency_map.get(analysis['urgency_level'], 0.2)
        
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
            
        response = national_security_pb2.AnalyzeResponse(
            alert_id=request.alert_id,
            severity_score=severity,
            risk_keywords=risk_keywords,
            english_translation=request.content_text,
            category=analysis.get('urgency_level', 'general')
        )
        
        if severity > 0.7:
            response.category = "emergency"
            
        # Update database asynchronously
        if self.db_pool:
            try:
                async with self.db_pool.acquire() as conn:
                    await conn.execute(
                        "UPDATE alerts SET severity_score = $1, risk_keywords = $2 WHERE id = $3",
                        severity, risk_keywords, request.alert_id
                    )
                    logger.info(f"💾 Persisted gRPC analysis for {request.alert_id} to database.")
            except Exception as e:
                logger.error(f"❌ Failed to persist gRPC analysis to DB: {e}")
            
        return response

async def serve(db_pool=None):
    server = grpc.aio.server()
    national_security_pb2_grpc.add_IntelligenceServiceServicer_to_server(
        IntelligenceServiceServicer(db_pool=db_pool), server
    )
    port = os.getenv("GRPC_PORT", "50051")
    
    ca_cert_file = os.getenv("GRPC_CA_CERT")
    server_cert_file = os.getenv("GRPC_SERVER_CERT")
    server_key_file = os.getenv("GRPC_SERVER_KEY")

    if ca_cert_file and server_cert_file and server_key_file:
        try:
            with open(ca_cert_file, 'rb') as f:
                root_certificates = f.read()
            with open(server_key_file, 'rb') as f:
                private_key = f.read()
            with open(server_cert_file, 'rb') as f:
                certificate_chain = f.read()

            server_credentials = grpc.ssl_server_credentials(
                [(private_key, certificate_chain)],
                root_certificates=root_certificates,
                require_client_auth=True
            )
            server.add_secure_port(f'[::]:{port}', server_credentials)
            logger.info(f"📡 gRPC Server started on port {port} (mTLS ENABLED)")
        except Exception as e:
            logger.error(f"❌ Failed to start gRPC server with mTLS: {e}")
            sys.exit(1)
    else:
        server.add_insecure_port(f'[::]:{port}')
        logger.info(f"⚠️ gRPC Server started on port {port} (INSECURE)")

    await server.start()
    return server
