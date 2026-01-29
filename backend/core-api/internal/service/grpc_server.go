package service

import (
	"context"
	"log"

	proto "national_security_platform/backend/core-api/pkg"

	"github.com/google/uuid"
)

// GrpcServer implements the CoreService gRPC server
type GrpcServer struct {
	proto.UnimplementedCoreServiceServer
	AlertService *AlertService
}

// SubmitAlert implements the SubmitAlert gRPC method
func (s *GrpcServer) SubmitAlert(ctx context.Context, req *proto.Alert) (*proto.SubmitAlertResponse, error) {
	log.Printf("📥 gRPC request received: SubmitAlert for User %s", req.UserId)

	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		return &proto.SubmitAlertResponse{
			Success:    false,
			TrackingId: "",
		}, nil
	}

	alert, err := s.AlertService.SubmitAlert(ctx, userID, req.Type, req.Latitude, req.Longitude, req.Content)
	if err != nil {
		return &proto.SubmitAlertResponse{
			Success:    false,
			TrackingId: "",
		}, nil
	}

	return &proto.SubmitAlertResponse{
		Success:    true,
		TrackingId: alert.ID.String(),
	}, nil
}
