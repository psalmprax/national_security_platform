package grpc

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"log"
	"os"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"

	pb "national_security_platform/backend/core-api/pkg"
)

type IntelligenceClient struct {
	client pb.IntelligenceServiceClient
	conn   *grpc.ClientConn
}

func NewIntelligenceClient(url string) (*IntelligenceClient, error) {
	var opts []grpc.DialOption

	caCertFile := os.Getenv("GRPC_CA_CERT")
	clientCertFile := os.Getenv("GRPC_CLIENT_CERT")
	clientKeyFile := os.Getenv("GRPC_CLIENT_KEY")

	if caCertFile != "" && clientCertFile != "" && clientKeyFile != "" {
		// Load client certificate
		cert, err := tls.LoadX509KeyPair(clientCertFile, clientKeyFile)
		if err != nil {
			return nil, fmt.Errorf("failed to load client certificate: %v", err)
		}

		// Load CA certificate
		caCert, err := os.ReadFile(caCertFile)
		if err != nil {
			return nil, fmt.Errorf("failed to read CA certificate: %v", err)
		}

		certPool := x509.NewCertPool()
		if !certPool.AppendCertsFromPEM(caCert) {
			return nil, fmt.Errorf("failed to append CA certificate")
		}

		// Create TLS credentials
		creds := credentials.NewTLS(&tls.Config{
			Certificates: []tls.Certificate{cert},
			RootCAs:      certPool,
			MinVersion:   tls.VersionTLS13,
		})
		opts = append(opts, grpc.WithTransportCredentials(creds))
		log.Printf("📡 gRPC client using mTLS for %s", url)
	} else {
		opts = append(opts, grpc.WithTransportCredentials(insecure.NewCredentials()))
		log.Printf("⚠️ gRPC client using insecure credentials for %s", url)
	}

	conn, err := grpc.Dial(url, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to intelligence service: %v", err)
	}

	client := pb.NewIntelligenceServiceClient(conn)
	return &IntelligenceClient{
		client: client,
		conn:   conn,
	}, nil
}

func (c *IntelligenceClient) AnalyzeAlert(ctx context.Context, alertID, text, lang string) (*pb.AnalyzeResponse, error) {
	req := &pb.AnalyzeRequest{
		AlertId:      alertID,
		ContentText:  text,
		LanguageCode: lang,
	}

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	resp, err := c.client.AnalyzeAlert(ctx, req)
	if err != nil {
		log.Printf("Error calling AnalyzeAlert: %v", err)
		return nil, err
	}

	return resp, nil
}

func (c *IntelligenceClient) Close() error {
	return c.conn.Close()
}
