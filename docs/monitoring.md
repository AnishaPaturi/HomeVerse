# HomeVerse Observability & Monitoring Architecture (Phase 38)

This document provides a comprehensive guide to HomeVerse's production monitoring, telemetry collection, Grafana dashboards, Prometheus scrapers, and AWS CloudWatch alerting systems.

---

## 1. Overview & Architecture

HomeVerse implements a multi-tier observability architecture providing real-time visibility into HTTP traffic, AI model inference, database performance, asynchronous queue depths, and host system resources:

```
                          ┌────────────────────────┐
                          │  Prometheus (Port 9090)│
                          │  Scrapes /metrics      │
                          └───────────┬────────────┘
                                      │
                                      ▼
                          ┌────────────────────────┐
                          │   Grafana (Port 3001)  │
                          │   Dashboards & Visuals │
                          └────────────────────────┘
                                      ▲
                                      │ (Scrapes every 5s)
┌─────────────────────────────────────┴─────────────────────────────────────┐
│                       HomeVerse Backend (FastAPI)                         │
│                                                                           │
│  ┌─────────────────────────┐              ┌────────────────────────────┐  │
│  │  PrometheusMiddleware   │              │   Telemetry Collectors     │  │
│  │  - Latency Histograms   │              │   - CPU & Memory (psutil)  │  │
│  │  - Request Counters     │              │   - DB Connection Pool     │  │
│  │  - Error Classifiers    │              │   - Background Queue Depths│  │
│  └─────────────────────────┘              └────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────┐              ┌────────────────────────────┐  │
│  │   AI Engine Telemetry   │              │   Budget Engine Telemetry  │  │
│  │   - Generation Latency  │              │   - Optimization Counts    │  │
│  │   - Failure Counts      │              │   - Scenario Simulations   │  │
│  └─────────────────────────┘              └────────────────────────────┘  │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
                                      ▼ (Production AWS)
                          ┌────────────────────────┐
                          │  AWS CloudWatch Alarms │
                          │  - ECS CPU / Memory    │
                          │  - ALB 5XX & Latency   │
                          │  - RDS Storage & Load  │
                          └────────────────────────┘
```

---

## 2. Telemetry & Metrics Catalog

### API Requests & Latency
| Metric Name | Type | Labels | Description |
|---|---|---|---|
| `homeverse_api_requests_total` | Counter | `method`, `endpoint`, `status_code` | Total count of HTTP requests processed |
| `homeverse_api_errors_total` | Counter | `method`, `endpoint`, `status_code`, `error_type` | Total count of 4xx and 5xx responses (`client_error`, `server_error`, `unhandled_exception`) |
| `homeverse_request_latency_seconds` | Histogram | `method`, `endpoint` | Request duration distribution across standard latency buckets (5ms to 10s) |

### AI Generation Performance
| Metric Name | Type | Labels | Description |
|---|---|---|---|
| `homeverse_ai_generation_requests_total` | Counter | `model`, `status` | AI design generation requests initiated and completed |
| `homeverse_ai_generation_failures_total` | Counter | `model`, `error_type` | Failed AI generation calls with failure root causes |
| `homeverse_ai_generation_duration_seconds` | Histogram | `model` | Latency distribution of multimodal and generative model calls |

### Budget & Project Telemetry
| Metric Name | Type | Labels | Description |
|---|---|---|---|
| `homeverse_budget_optimizations_total` | Counter | `status` | Count of budget optimization and what-if simulation executions |
| `homeverse_active_projects_total` | Gauge | None | Number of active interior design projects in the database |

### Database & Resource Utilization
| Metric Name | Type | Labels | Description |
|---|---|---|---|
| `homeverse_db_connections_active` | Gauge | None | Active connections currently checked out from SQLAlchemy pool |
| `homeverse_db_connections_idle` | Gauge | None | Idle connections retained in the pool |
| `homeverse_db_pool_size` | Gauge | None | Configured connection pool size |
| `homeverse_db_pool_overflow` | Gauge | None | Overflow connections created beyond standard pool |
| `homeverse_db_query_duration_seconds` | Histogram | `query_type` | Database query execution latency |
| `homeverse_cpu_usage_percent` | Gauge | None | Backend application process CPU utilization |
| `homeverse_system_cpu_percent` | Gauge | None | Host machine overall CPU utilization |
| `homeverse_memory_usage_bytes` | Gauge | None | Resident memory (RSS) consumed by the backend process |
| `homeverse_memory_usage_percent` | Gauge | None | Process memory utilization as a percentage of system RAM |
| `homeverse_queue_length` | Gauge | `queue_name` | Pending jobs in the Celery / Redis background queue |

---

## 3. Prometheus & Grafana Configuration

### Prometheus Scraping
The Prometheus server scrapes `/metrics` directly from the backend container every 5 seconds:

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'homeverse-backend'
    metrics_path: '/metrics'
    scrape_interval: 5s
    static_configs:
      - targets: ['backend:8080']
```

### Grafana Auto-Provisioning
Grafana automatically provisions the Prometheus datasource and HomeVerse dashboard on container boot without manual setup:
- **Datasource**: [`monitoring/grafana/provisioning/datasources/prometheus.yml`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/monitoring/grafana/provisioning/datasources/prometheus.yml)
- **Dashboard Provider**: [`monitoring/grafana/provisioning/dashboards/dashboards.yml`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/monitoring/grafana/provisioning/dashboards/dashboards.yml)
- **Dashboard JSON**: [`monitoring/grafana/dashboards/homeverse-metrics.json`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/monitoring/grafana/dashboards/homeverse-metrics.json)

### Running Locally with Docker Compose
To start the monitoring stack locally:
```bash
docker compose up -d prometheus grafana
```

Access:
- **Prometheus UI**: `http://localhost:9090`
- **Grafana UI**: `http://localhost:3001` (Default credentials: `admin` / `admin`)
- **Backend Metrics**: `http://localhost:8080/metrics`
- **Telemetry JSON Summary**: `http://localhost:8080/api/monitoring/metrics/summary`

---

## 4. AWS CloudWatch Alarms & Dashboards (Terraform)

Production alarms are codified in [`infrastructure/terraform/cloudwatch.tf`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/infrastructure/terraform/cloudwatch.tf):

| Alarm Name | Metric | Evaluation Window | Threshold | Severity |
|---|---|---|---|---|
| `ecs_cpu_high` | `AWS/ECS:CPUUtilization` | 2 x 5 minutes | $\ge$ 80% | High |
| `ecs_memory_high` | `AWS/ECS:MemoryUtilization` | 2 x 5 minutes | $\ge$ 80% | High |
| `alb_5xx_errors` | `AWS/ApplicationELB:HTTPCode_Target_5XX_Count` | 1 x 5 minutes | $\ge$ 10 errors | Critical |
| `alb_high_latency` | `AWS/ApplicationELB:TargetResponseTime` | 2 x 5 minutes | p95 $>$ 2.0s | Medium |
| `rds_cpu_high` | `AWS/RDS:CPUUtilization` | 2 x 5 minutes | $\ge$ 80% | High |
| `rds_low_storage` | `AWS/RDS:FreeStorageSpace` | 1 x 5 minutes | $<$ 5 GB | Critical |

---

## 5. API Endpoints

- `GET /metrics`: Standard Prometheus scrapable text format (`Content-Type: text/plain; version=0.0.4`).
- `GET /api/monitoring/metrics/summary`: Clean JSON payload containing API throughput, error rates, average latency, and system resource telemetry.
- `GET /api/monitoring/health`: Operational health check for the monitoring subsystem.
- `POST /api/monitoring/cloudwatch/publish`: Flushes current telemetry directly to AWS CloudWatch.
