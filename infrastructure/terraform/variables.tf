variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (development, staging, production)"
  type        = string
  default     = "development"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "homeverse"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# -------------------------------------------------------------
# Database (RDS PostgreSQL) Variables
# -------------------------------------------------------------
variable "db_instance_class" {
  description = "Instance class for RDS PostgreSQL"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB for RDS"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "homeverse"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "homeverse_admin"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
  default     = "ChangeMeStrongPassword2026!"
}

# -------------------------------------------------------------
# Compute & Container (ECS Fargate) Variables
# -------------------------------------------------------------
variable "backend_cpu" {
  description = "CPU units for backend Fargate task (256, 512, 1024, etc.)"
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Memory in MB for backend Fargate task (512, 1024, 2048, etc.)"
  type        = number
  default     = 512
}

variable "frontend_cpu" {
  description = "CPU units for frontend Fargate task"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory in MB for frontend Fargate task"
  type        = number
  default     = 512
}

variable "backend_desired_count" {
  description = "Desired count of running backend container instances"
  type        = number
  default     = 1
}

variable "frontend_desired_count" {
  description = "Desired count of running frontend container instances"
  type        = number
  default     = 1
}

variable "enable_cloudfront" {
  description = "Whether to provision Amazon CloudFront CDN distribution"
  type        = bool
  default     = true
}
