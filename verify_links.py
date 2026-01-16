import re
import subprocess

with open('portfolio_links.txt', 'r') as f:
    content = f.read()

urls = re.findall(r'\[img\](.*?)\[/img\]', content)

for url in urls:
    try:
        result = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', url], capture_output=True, text=True, check=True)
        status_code = result.stdout.strip()
        if status_code == '200':
            print(f'{url} - OK')
        else:
            print(f'{url} - FAILED with status code {status_code}')
    except subprocess.CalledProcessError as e:
        print(f'{url} - FAILED with error: {e}')
