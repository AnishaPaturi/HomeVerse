# HomeVerse Infrastructure Root Module

# Local variables and module orchestrations
locals {
  common_tags = {
    Environment = var.environment
    Application = var.project_name
    Owner       = "HomeVerse Core Team"
  }
}
