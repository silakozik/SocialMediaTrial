from dotenv import load_dotenv
from imagekitio import ImageKit
import os

load_dotenv()

# Bu sürümde ImageKit __init__ argüman almıyor; yapılandırma ortam değişkenleriyle yapılacak.
imagekit = ImageKit()

