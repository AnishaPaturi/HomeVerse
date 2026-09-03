output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "rds_endpoint" {
  description = "PostgreSQL RDS connection endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "s3_bucket_name" {
  description = "S3 Uploads bucket name"
  value       = aws_s3_bucket.uploads.id
}

output "ecs_cluster_id" {
  description = "ECS cluster identifier"
  value       = aws_ecs_cluster.main.id
}
