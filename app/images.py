from dotenv import load_dotenv
from imagekitio import ImageKit
import os

load_dotenv()

# ImageKit 5.x sürümünde sadece private_key gereklidir
# public_key ve url_endpoint environment variable'lardan otomatik olarak alınır
imagekit = ImageKit(
    private_key=os.getenv("IMAGEKIT_PRIVATE_KEY")
)

