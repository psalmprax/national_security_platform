import grpc
from concurrent import futures
import logging
import sys
import os

# Add the backend directory to sys.path to import generated stubs
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

import national_security_pb2
import national_security_pb2_grpc

logger = logging.getLogger("intelligence-service-grpc")

class IntelligenceServiceServicer(national_security_pb2_grpc.IntelligenceServiceServicer):
    def AnalyzeAlert(self, request, context):
        logger.info(f"Received gRPC AnalyzeAlert request for ID: {request.alert_id}")
        
        # Simple analysis logic (matching the design)
        content = request.content_text.lower()
        keywords = []
        severity = 0.2
        
        if any(w in content for w in ["bomb", "gun", "attack", "kill"]):
            severity = 0.9
            keywords.append("violence")
        if any(w in content for w in ["kidnap", "abduct"]):
            severity = 0.8
            keywords.append("kidnapping")
        if any(w in content for w in ["fire", "smoke"]):
            severity = 0.6
            keywords.append("fire")
            
        response = national_security_pb2.AnalyzeResponse(
            alert_id=request.alert_id,
            severity_score=severity,
            risk_keywords=keywords,
            english_translation=request.content_text, # Assuming already English or mock translation
            category="general"
        )
        
        if severity > 0.7:
            response.category = "emergency"
            
        return response

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    national_security_pb2_grpc.add_IntelligenceServiceServicer_to_server(
        IntelligenceServiceServicer(), server
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

    server.start()
    return server
