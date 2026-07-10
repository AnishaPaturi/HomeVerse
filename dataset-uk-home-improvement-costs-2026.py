import kagglehub

# Download latest version
path = kagglehub.dataset_download("thestephenevans/uk-home-improvement-costs-2026")

print("Path to dataset files:", path)