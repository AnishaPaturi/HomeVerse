import kagglehub

# Download latest version
path = kagglehub.dataset_download("annielu21/house-rooms")

print("Path to dataset files:", path)