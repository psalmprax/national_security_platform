import grpc
import logging
import sys
import os
import asyncio

# Add the backend directory to sys.path to import generated stubs
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

import national_security_pb2
import national_security_pb2_grpc

logger = logging.getLogger("intelligence-service-grpc")

class IntelligenceServiceServicer(national_security_pb2_grpc.IntelligenceServiceServicer):
    def __init__(self, db_pool=None):
        self.db_pool = db_pool

    async def AnalyzeAlert(self, request, context):
        logger.info(f"Received gRPC AnalyzeAlert request for ID: {request.alert_id}")
        
        # Simple analysis logic
        content = request.content_text.lower()
        keywords = []
        severity = 0.2
        
        # Critical keywords
        critical_terms = ['gunshot', 'bomb', 'explosion', 'fire', 'terrorist', 'attack', 'kidnap', 'emergency']
        # High risk keywords
        high_risk_terms = ['suspicious', 'threat', 'fighting', 'robbery', 'riot', 'protest']
        
        for term in critical_terms:
            if term in content:
                severity = max(severity, 0.95)
                keywords.append(term)
                
        for term in high_risk_terms:
            if term in content:
                severity = max(severity, 0.75)
                keywords.append(term)
                
        if not keywords and content:
            severity = 0.3
            keywords = ["general_alert"]
            
        response = national_security_pb2.AnalyzeResponse(
            alert_id=request.alert_id,
            severity_score=severity,
            risk_keywords=keywords,
            english_translation=request.content_text,
            category="general"
        )
        
        if severity > 0.7:
            response.category = "emergency"
            
        # Update database asynchronously
        if self.db_pool:
            try:
                async with self.db_pool.acquire() as conn:
                    await conn.execute(
                        "UPDATE alerts SET severity_score = $1, risk_keywords = $2 WHERE id = $3",
                        severity, keywords, request.alert_id
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
