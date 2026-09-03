resource "aws_s3_bucket" "uploads" {
  bucket        = "${var.project_name}-uploads-${var.environment}"
  force_destroy = false

  tags = {
    Name = "${var.project_name}-uploads"
  }
}

resource "aws_s3_bucket_public_access_block" "uploads_pab" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "uploads_cors" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
