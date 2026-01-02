
import os
import requests
from urllib.parse import urlparse

def download_images(url_file, save_dir):
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    with open(url_file, 'r') as f:
        urls = f.readlines()

    for url in urls:
        url = url.strip()
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()  # Raise an exception for bad status codes

            # Get the filename from the URL
            parsed_url = urlparse(url)
            filename = os.path.basename(parsed_url.path)
            
            # Save the image
            with open(os.path.join(save_dir, filename), 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"Successfully downloaded {filename}")

        except requests.exceptions.RequestException as e:
            print(f"Failed to download {url}: {e}")

if __name__ == "__main__":
    download_images('image_urls.txt', 'portfolio_images')
