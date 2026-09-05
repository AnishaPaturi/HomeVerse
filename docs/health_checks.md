# HomeVerse Health Checks & Readiness Subsystem (Phase 39)

This document specifies the health check endpoints, readiness and liveness probes, response schemas, and orchestrator integrations implemented across the HomeVerse platform.

---

## 1. Health Probe Architecture

HomeVerse provides granular health probes designed for container orchestrators (AWS ECS, Kubernetes), cloud load balancers (AWS ALB), and automated post-deployment verification:

```
                  ┌────────────────────────────────────────┐
                  │       AWS Application Load Balancer    │
                  └───────────────────┬────────────────────┘
                                      │ (Periodic ping every 30s)
                                      ▼
                        GET /health (Liveness Probe)
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
      GET /health/db                                  GET /health/redis
   (SELECT 1 Database ping)                         (Redis ping command)
              │                                               │
              └───────────────────────┬───────────────────────┘
                                      ▼
                               GET /health/full
                        (Composite Application Health)
```

---

## 2. Endpoint Reference

### 1. API Liveness Probe (`GET /health` and `GET /health/live`)
Fast, non-blocking check verifying that the Uvicorn/FastAPI process is alive and actively serving HTTP requests.

- **URL**: `/health` (or `/health/live`, `/api/health`)
- **HTTP Method**: `GET`
- **Expected Status**: `200 OK`
- **Response Format**:
  ```json
  {
    "status": "ok",
    "api": "healthy",
    "service": "HomeVerse",
    "environment": "development"
  }
  ```

### 2. Database Health Probe (`GET /health/db`)
Executes an active `SELECT 1` query against the connected SQLAlchemy database engine (PostgreSQL in production, SQLite in local development) and calculates round-trip query latency.

- **URL**: `/health/db` (or `/api/health/db`)
- **HTTP Method**: `GET`
- **Expected Status**:
  - `200 OK`: Database connected and executing queries.
  - `503 Service Unavailable`: Database unreachable, pool exhausted, or connection refused.
- **Healthy Response**:
  ```json
  {
    "status": "ok",
    "database": "healthy",
    "latency_ms": 1.24,
    "dialect": "postgresql"
  }
  ```
- **Unhealthy Response**:
  ```json
  {
    "status": "unhealthy",
    "database": "unhealthy",
    "error": "connection to server at 'localhost', port 5432 failed: Connection refused",
    "latency_ms": 1002.5
  }
  ```

### 3. Redis Health Probe (`GET /health/redis`)
Connects to the configured Redis instance (`REDIS_URL` or `CELERY_BROKER_URL`) and issues a `PING` command to verify cache and task worker queue availability.

- **URL**: `/health/redis` (or `/api/health/redis`)
- **HTTP Method**: `GET`
- **Expected Status**:
  - `200 OK`: Redis returned `PONG`.
  - `503 Service Unavailable`: Redis unreachable or socket timeout exceeded.
- **Healthy Response**:
  ```json
  {
    "status": "ok",
    "redis": "healthy",
    "latency_ms": 0.85
  }
  ```
- **Unhealthy Response**:
  ```json
  {
    "status": "unhealthy",
    "redis": "unhealthy",
    "error": "Error 10061 connecting to localhost:6379. Connection refused.",
    "latency_ms": 1001.2
  }
  ```

### 4. Composite Application Health (`GET /health/full`)
Aggregates API, Database, and Redis health into a single unified status response as required by Phase 39.

- **URL**: `/health/full` (or `/api/health/full`)
- **HTTP Method**: `GET`
- **Expected Status**:
  - `200 OK`: All subsystems (`api`, `database`, `redis`) are healthy.
  - `503 Service Unavailable`: One or more subsystems are degraded or unreachable.
- **Healthy Response**:
  ```json
  {
    "status": "healthy",
    "api": "healthy",
    "database": "healthy",
    "redis": "healthy",
    "details": {
      "database": {
        "status": "healthy",
        "latency_ms": 1.24,
        "dialect": "postgresql",
        "error": null
      },
      "redis": {
        "status": "healthy",
        "latency_ms": 0.85,
        "error": null
      }
    }
  }
  ```

### 5. Orchestrator Readiness Probe (`GET /health/ready`)
Ensures database connectivity is established before Kubernetes or ECS routes external user traffic to the container.

- **URL**: `/health/ready`
- **HTTP Method**: `GET`
- **Expected Status**: `200 OK` when database is ready, `503 Service Unavailable` when initializing or down.

---

## 3. Load Balancer & Orchestration Integration

### AWS Application Load Balancer (ALB)
The ALB backend target group (`aws_lb_target_group.backend`) targets `/health` with a 30-second polling interval and a 2-consecutive-success healthy threshold:
```hcl
# infrastructure/terraform/compute.tf
resource "aws_lb_target_group" "backend" {
  name        = "${var.project_name}-tg-backend"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/health"
    port                = "8080"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}
```

### Docker Compose Healthcheck
```yaml
backend:
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 5s
```

---

## 4. Automated Verification

Run unit and integration tests covering all health check endpoints and error simulation branches:
```bash
pytest backend/tests/api/test_health.py -v
```

Run post-deployment smoke tests against any running environment:
```bash
python scripts/smoke_test.py http://localhost:8080
```
