package storage

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// S3Provider implements the StorageProvider interface for S3-compatible storage
type S3Provider struct {
	client       *minio.Client
	providerName string // e.g., "MINIO" or "AWS_S3"
}

// NewS3Provider creates a new S3-compatible storage provider
func NewS3Provider(endpoint, accessKey, secretKey string, useSSL bool, providerName string) (*S3Provider, error) {
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to initialize S3 client: %w", err)
	}

	return &S3Provider{
		client:       minioClient,
		providerName: providerName,
	}, nil
}

func (p *S3Provider) Upload(ctx context.Context, bucketName string, objectKey string, data io.Reader, contentType string) (string, error) {
	// Ensure bucket exists
	exists, err := p.client.BucketExists(ctx, bucketName)
	if err != nil {
		return "", fmt.Errorf("failed to check bucket existence: %w", err)
	}
	if !exists {
		err = p.client.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{})
		if err != nil {
			return "", fmt.Errorf("failed to create bucket: %w", err)
		}
	}

	// Upload object
	info, err := p.client.PutObject(ctx, bucketName, objectKey, data, -1, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload object: %w", err)
	}

	return info.Key, nil
}

func (p *S3Provider) GetDownloadURL(ctx context.Context, bucketName string, objectKey string, expiry time.Duration) (string, error) {
	reqParams := make(url.Values)
	presignedURL, err := p.client.PresignedGetObject(ctx, bucketName, objectKey, expiry, reqParams)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return presignedURL.String(), nil
}

func (p *S3Provider) Delete(ctx context.Context, bucketName string, objectKey string) error {
	err := p.client.RemoveObject(ctx, bucketName, objectKey, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to remove object: %w", err)
	}
	return nil
}

func (p *S3Provider) ProviderType() string {
	return p.providerName
}
