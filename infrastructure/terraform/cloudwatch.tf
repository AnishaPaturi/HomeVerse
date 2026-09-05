# ==============================================================================
# HomeVerse CloudWatch Alarms & Observability Dashboard (Phase 38)
# Configures CloudWatch Metric Alarms for ECS, ALB, RDS, and production dashboard
# ==============================================================================

# -------------------------------------------------------------
# ECS Fargate CPU Utilization Alarm (> 80%)
# -------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-ecs-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggered when ECS Backend container CPU utilization exceeds 80% for 10 minutes."
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.backend.name
  }

  tags = {
    Name        = "${var.project_name}-ecs-cpu-high-alarm"
    Environment = var.environment
  }
}

# -------------------------------------------------------------
# ECS Fargate Memory Utilization Alarm (> 80%)
# -------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.project_name}-ecs-memory-high-${var.environment}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggered when ECS Backend container memory utilization exceeds 80% for 10 minutes."
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.backend.name
  }

  tags = {
    Name        = "${var.project_name}-ecs-memory-high-alarm"
    Environment = var.environment
  }
}

# -------------------------------------------------------------
# ALB Target 5XX Error Rate Alarm (>= 10 errors in 5 min)
# -------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${var.project_name}-alb-5xx-high-${var.environment}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Triggered when ALB target 5XX error responses exceed 10 in a 5-minute window."
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.backend.arn_suffix
  }

  tags = {
    Name        = "${var.project_name}-alb-5xx-alarm"
    Environment = var.environment
  }
}

# -------------------------------------------------------------
# ALB High Latency Alarm (p95 Target Response Time > 2.0s)
# -------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "alb_high_latency" {
  alarm_name          = "${var.project_name}-alb-latency-high-${var.environment}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  extended_statistic  = "p95"
  threshold           = 2.0
  alarm_description   = "Triggered when ALB target response time (p95) exceeds 2.0 seconds."
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.backend.arn_suffix
  }

  tags = {
    Name        = "${var.project_name}-alb-latency-alarm"
    Environment = var.environment
  }
}

# -------------------------------------------------------------
# RDS PostgreSQL High CPU Utilization Alarm (> 80%)
# -------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.project_name}-rds-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggered when RDS PostgreSQL CPU utilization exceeds 80%."
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }

  tags = {
    Name        = "${var.project_name}-rds-cpu-alarm"
    Environment = var.environment
  }
}

# -------------------------------------------------------------
# RDS Low Storage Space Alarm (< 5 GB Free)
# -------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "rds_low_storage" {
  alarm_name          = "${var.project_name}-rds-low-storage-${var.environment}"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 5368709120 # 5 GB in bytes
  alarm_description   = "Triggered when RDS free disk storage drops below 5 GB."
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }

  tags = {
    Name        = "${var.project_name}-rds-storage-alarm"
    Environment = var.environment
  }
}

# -------------------------------------------------------------
# Production CloudWatch Dashboard
# -------------------------------------------------------------
resource "aws_cloudwatch_dashboard" "homeverse_ops" {
  dashboard_name = "${var.project_name}-operational-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix, { "stat" = "Sum", "period" = 60 }],
            [".", "HTTPCode_Target_2XX_Count", ".", ".", { "stat" = "Sum", "period" = 60 }],
            [".", "HTTPCode_Target_4XX_Count", ".", ".", { "stat" = "Sum", "period" = 60, "color" = "#ff7f0e" }],
            [".", "HTTPCode_Target_5XX_Count", ".", ".", { "stat" = "Sum", "period" = 60, "color" = "#d62728" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ALB Request Volume and Status Codes"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix, { "stat" = "Average", "period" = 60, "label" = "Average" }],
            [".", ".", ".", ".", { "stat" = "p95", "period" = 60, "label" = "p95", "color" = "#ff7f0e" }],
            [".", ".", ".", ".", { "stat" = "p99", "period" = 60, "label" = "p99", "color" = "#d62728" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ALB Target Latency (Average, p95, p99)"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.backend.name, "ClusterName", aws_ecs_cluster.main.name, { "stat" = "Average", "period" = 60 }],
            [".", "MemoryUtilization", ".", ".", ".", ".", { "stat" = "Average", "period" = 60, "color" = "#2ca02c" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ECS Fargate CPU and Memory Utilization"
          yAxis = {
            left = { min = 0, max = 100 }
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.postgres.id, { "stat" = "Average", "period" = 60 }],
            [".", "DatabaseConnections", ".", ".", { "stat" = "Average", "period" = 60, "yAxis" = "right" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "RDS PostgreSQL CPU & Active Connections"
        }
      }
    ]
  })
}
