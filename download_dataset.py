import urllib.request
import gzip
import os

def download_and_extract():
    url = 'https://snap.stanford.edu/data/roadNet-CA.txt.gz'
    gz_path = 'dataset/roadNet-CA.txt.gz'
    txt_path = 'dataset/roadNet-CA.txt'
    
    os.makedirs('dataset', exist_ok=True)
    
    if not os.path.exists(txt_path):
        if not os.path.exists(gz_path):
            print(f"Downloading {url}...")
            urllib.request.urlretrieve(url, gz_path)
            print("Download complete.")
        
        print(f"Extracting {gz_path}...")
        with gzip.open(gz_path, 'rb') as f_in:
            with open(txt_path, 'wb') as f_out:
                f_out.write(f_in.read())
        print("Extraction complete.")
    else:
        print(f"{txt_path} already exists.")

if __name__ == "__main__":
    download_and_extract()
