"""
AWS CloudWatch Metrics Publisher for HomeVerse (Phase 38)
Publishes application telemetry to CloudWatch for production monitoring,
dashboards, and metric alarms.
"""
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.config import settings
from app.monitoring.metrics import get_metrics_summary

logger = logging.getLogger("homeverse.monitoring.cloudwatch")


class CloudWatchMetricsPublisher:
    """
    Publishes custom metrics to AWS CloudWatch namespace HomeVerse/Application.
    Operates safely: silently logs warnings if credentials or network is unavailable
    rather than failing application requests.
    """

    def __init__(
        self,
        namespace: Optional[str] = None,
        region_name: Optional[str] = None,
        enabled: Optional[bool] = None,
    ):
        self.namespace = namespace or getattr(settings, "CLOUDWATCH_NAMESPACE", "HomeVerse/Application")
        self.region_name = region_name or getattr(settings, "AWS_REGION", "us-east-1")
        self.enabled = (
            enabled
            if enabled is not None
            else getattr(settings, "ENABLE_CLOUDWATCH_METRICS", False)
        )
        self._client = None

    @property
    def client(self):
        """Lazy load boto3 CloudWatch client."""
        if self._client is None and self.enabled:
            try:
                import boto3
                self._client = boto3.client(
                    "cloudwatch",
                    region_name=self.region_name,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
                )
            except Exception as e:
                logger.warning(f"Could not initialize CloudWatch client: {e}")
                self._client = None
        return self._client

    def put_metric(
        self,
        metric_name: str,
        value: float,
        unit: str = "None",
        dimensions: Optional[List[Dict[str, str]]] = None,
    ) -> bool:
        """
        Send a single metric data point to CloudWatch.
        Supported units: Seconds, Microseconds, Milliseconds, Bytes, Kilobytes,
                         Megabytes, Gigabytes, Percent, Count, None.
        """
        if not self.enabled or self.client is None:
            return False

        dims = dimensions or [{"Name": "Environment", "Value": settings.ENVIRONMENT}]

        try:
            self.client.put_metric_data(
                Namespace=self.namespace,
                MetricData=[
                    {
                        "MetricName": metric_name,
                        "Dimensions": dims,
                        "Timestamp": datetime.now(timezone.utc),
                        "Value": float(value),
                        "Unit": unit,
                    }
                ],
            )
            return True
        except Exception as e:
            logger.warning(f"Failed to publish metric {metric_name} to CloudWatch: {e}")
            return False

    def put_batch_metrics(self, metric_data: List[Dict[str, Any]]) -> bool:
        """
        Publish up to 20 metric data points in a single PutMetricData request.
        """
        if not self.enabled or self.client is None or not metric_data:
            return False

        try:
            # CloudWatch supports up to 1000 metrics per request, but 20 is recommended chunk size
            for i in range(0, len(metric_data), 20):
                chunk = metric_data[i : i + 20]
                self.client.put_metric_data(
                    Namespace=self.namespace,
                    MetricData=chunk,
                )
            return True
        except Exception as e:
            logger.warning(f"Failed to publish batch metrics to CloudWatch: {e}")
            return False

    def publish_system_and_api_telemetry(self) -> bool:
        """
        Collect current summary telemetry and push standard CloudWatch metric set:
        - APIRequests (Count)
        - APIErrors (Count)
        - AverageResponseTime (Milliseconds)
        - ProcessCPUUtilization (Percent)
        - ProcessMemoryUtilization (Percent)
        - ProcessMemoryRSS (Bytes)
        """
        if not self.enabled:
            return False

        summary = get_metrics_summary()
        now = datetime.now(timezone.utc)
        env_dim = [{"Name": "Environment", "Value": settings.ENVIRONMENT}]

        api_stats = summary.get("api", {})
        sys_stats = summary.get("system", {})

        metric_data = [
            {
                "MetricName": "APIRequests",
                "Dimensions": env_dim,
                "Timestamp": now,
                "Value": float(api_stats.get("total_requests", 0)),
                "Unit": "Count",
            },
            {
                "MetricName": "APIErrors",
                "Dimensions": env_dim,
                "Timestamp": now,
                "Value": float(api_stats.get("total_errors", 0)),
                "Unit": "Count",
            },
            {
                "MetricName": "AverageResponseTime",
                "Dimensions": env_dim,
                "Timestamp": now,
                "Value": float(api_stats.get("average_response_time_ms", 0.0)),
                "Unit": "Milliseconds",
            },
            {
                "MetricName": "ProcessCPUUtilization",
                "Dimensions": env_dim,
                "Timestamp": now,
                "Value": float(sys_stats.get("process_cpu_percent", 0.0)),
                "Unit": "Percent",
            },
            {
                "MetricName": "ProcessMemoryUtilization",
                "Dimensions": env_dim,
                "Timestamp": now,
                "Value": float(sys_stats.get("memory_percent", 0.0)),
                "Unit": "Percent",
            },
            {
                "MetricName": "ProcessMemoryRSS",
                "Dimensions": env_dim,
                "Timestamp": now,
                "Value": float(sys_stats.get("memory_usage_bytes", 0.0)),
                "Unit": "Bytes",
            },
        ]

        return self.put_batch_metrics(metric_data)


# Global singleton instance
cloudwatch_publisher = CloudWatchMetricsPublisher()
