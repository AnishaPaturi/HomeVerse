import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("GEMINI_API_KEY is not set.")
    exit(1)

genai.configure(api_key=api_key)

def load_image(path):
    import PIL.Image
    return PIL.Image.open(path)

img_dir = "../Help images" if os.path.exists("../Help images") else "Help images"
if not os.path.exists(img_dir):
    img_dir = "C:\\Users\\anish\\OneDrive\\College\\Projects\\HomeVerse\\Help images"

problem_path = os.path.join(img_dir, "problem1.png")
if os.path.exists(problem_path):
    try:
        problem_img = load_image(problem_path)
        prompt = """
        This is problem1.png from the user's help images. It shows a screenshot of the HomeVerse application.
        Please describe:
        1. What is visible in the screenshot?
        2. Are there any errors, warnings, black screens, or visual bugs shown in the image?
        3. Explain what the user is experiencing based on this image.
        """
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content([problem_img, prompt])
        
        # Write to a file with UTF-8 encoding
        with open("problem_report.txt", "w", encoding="utf-8") as f:
            f.write(response.text)
        print("Success! Written to problem_report.txt")
    except Exception as e:
        print("Error analyzing problem1.png:", e)
else:
    print("problem1.png not found at path:", problem_path)
