import kagglehub

# Download latest version
path = kagglehub.dataset_download("carafina/interior-designers-and-decorators-in-bangalore")

print("Path to dataset files:", path)