# Monitoring & Observability Implementation Plan

## 1. Technology Stack

### Core Components
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **AlertManager**: Alert routing and notification
- **Jaeger**: Distributed tracing
- **ELK Stack**: Log aggregation and analysis

### Docker Compose Addition
```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_OTLP_ENABLED=true

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    ports:
      - "5044:5044"
    volumes:
      - ./monitoring/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch
```

## 2. Metrics Implementation

### Go Application Metrics
```go
// backend/core-api/internal/middleware/metrics.go
package middleware

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    httpRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )
    
    httpRequestDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "http_request_duration_seconds",
            Help: "HTTP request duration in seconds",
        },
        []string{"method", "endpoint"},
    )
    
    activeConnections = promauto.NewGauge(
        prometheus.GaugeOpts{
            Name: "active_connections",
            Help: "Number of active connections",
        },
    )
)
```

### Python Application Metrics
```python
# backend/intelligence-service/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# Metrics
REQUESTS_TOTAL = Counter('requests_total', 'Total requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('request_duration_seconds', 'Request duration')
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Active connections')
MODEL_INFERENCE_TIME = Histogram('model_inference_seconds', 'Model inference time')
```

### Frontend Metrics
```typescript
// web/lib/metrics.ts
export class MetricsCollector {
    private static instance: MetricsCollector;
    
    static getInstance(): MetricsCollector {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }
    
    trackPageView(page: string): void {
        // Send to analytics endpoint
        fetch('/api/v1/metrics/page-view', {
            method: 'POST',
            body: JSON.stringify({ page, timestamp: Date.now() })
        });
    }
    
    trackUserAction(action: string, context?: any): void {
        fetch('/api/v1/metrics/user-action', {
            method: 'POST',
            body: JSON.stringify({ action, context, timestamp: Date.now() })
        });
    }
    
    trackPerformance(metric: string, value: number): void {
        fetch('/api/v1/metrics/performance', {
            method: 'POST',
            body: JSON.stringify({ metric, value, timestamp: Date.now() })
        });
    }
}
```

## 3. Logging Implementation

### Structured Logging (Go)
```go
// backend/core-api/internal/logger/logger.go
package logger

import (
    "github.com/sirupsen/logrus"
    "github.com/google/uuid"
)

type Logger struct {
    *logrus.Logger
}

func NewLogger() *Logger {
    log := logrus.New()
    log.SetFormatter(&logrus.JSONFormatter{})
    log.SetLevel(logrus.InfoLevel)
    
    return &Logger{Logger: log}
}

func (l *Logger) WithRequestID(requestID uuid.UUID) *logrus.Entry {
    return l.WithField("request_id", requestID.String())
}

func (l *Logger) WithUserID(userID uuid.UUID) *logrus.Entry {
    return l.WithField("user_id", userID.String())
}
```

### Structured Logging (Python)
```python
# backend/intelligence-service/logger.py
import logging
import json
from datetime import datetime

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Create structured formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        handler = logging.StreamHandler()
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
    
    def info(self, message: str, **kwargs):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': 'INFO',
            'message': message,
            **kwargs
        }
        self.logger.info(json.dumps(log_data))
    
    def error(self, message: str, **kwargs):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': 'ERROR',
            'message': message,
            **kwargs
        }
        self.logger.error(json.dumps(log_data))
```

## 4. Alerting Rules

### Prometheus Alert Rules (`monitoring/alerts.yml`)
```yaml
groups:
  - name: system.rules
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"
      
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"
      
      - alert: DatabaseDown
        expr: up{job="cockroachdb"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
          description: "CockroachDB has been down for more than 1 minute"
      
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"
```

## 5. Grafana Dashboards

### System Overview Dashboard
- **CPU Usage**: System and container CPU utilization
- **Memory Usage**: System and container memory utilization
- **Disk Usage**: Disk space and I/O metrics
- **Network Traffic**: Network bandwidth and latency
- **Container Health**: Container status and restarts

### Application Dashboard
- **Request Rate**: HTTP requests per second
- **Response Time**: Request latency percentiles
- **Error Rate**: HTTP error rates by status code
- **Active Connections**: Number of active connections
- **Database Performance**: Query performance and connection pool

### Business Metrics Dashboard
- **Alert Volume**: Number of alerts per hour/day
- **User Activity**: Active users and sessions
- **Geospatial Metrics**: Alerts by region/LGA
- **Response Times**: Alert response and resolution times
- **System Health**: Overall system health score

## 6. Validation Checklist

### Metrics Validation ✅
- [ ] All services expose Prometheus metrics
- [ ] Custom business metrics tracked
- [ ] Performance metrics collected
- [ ] Error metrics captured
- [ ] Resource metrics monitored

### Logging Validation ✅
- [ ] Structured logging implemented
- [ ] Log aggregation working
- [ ] Log search functionality
- [ ] Log retention policies
- [ ] Sensitive data redaction

### Alerting Validation ✅
- [ ] Alert rules configured
- [ ] Notification channels working
- [ ] Alert escalation procedures
- [ ] False positive minimization
- [ ] Alert response documentation

### Dashboard Validation ✅
- [ ] System overview dashboard
- [ ] Application performance dashboard
- [ ] Business metrics dashboard
- [ ] Alert management dashboard
- [ ] Mobile-responsive dashboards

## 7. Success Metrics

### Monitoring Coverage
- **Metrics Coverage**: 100% of services instrumented
- **Log Coverage**: 100% of applications logging
- **Alert Coverage**: All critical conditions alerted
- **Dashboard Coverage**: All key metrics visualized

### Performance Targets
- **Metric Collection**: <1% overhead
- **Log Processing**: <5 minutes latency
- **Alert Delivery**: <1 minute latency
- **Dashboard Loading**: <3 seconds

## 8. Implementation Timeline

### Week 1: Infrastructure Setup
- Deploy monitoring stack
- Configure Prometheus and Grafana
- Set up log aggregation

### Week 2: Application Instrumentation
- Add metrics to Go services
- Add metrics to Python services
- Implement structured logging

### Week 3: Alerting and Dashboards
- Configure alert rules
- Create Grafana dashboards
- Set up notification channels

### Week 4: Validation and Optimization
- Test alerting scenarios
- Optimize dashboard performance
- Document monitoring procedures