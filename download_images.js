import https from 'https';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

const downloadImages = (urlFile, saveDir) => {
    if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir);
    }

    const urls = fs.readFileSync(urlFile, 'utf-8').split('\n').filter(Boolean);

    urls.forEach((url, index) => {
        const cleanedUrl = url.replace('[/img]', '').trim();
        if (!cleanedUrl) return;

        try {
            const parsedUrl = new URL(cleanedUrl);
            let filename = path.basename(parsedUrl.pathname);

            if (!filename || filename === 'img' || filename === '/') {
                const extension = path.extname(parsedUrl.pathname);
                filename = `image_${index}${extension || '.jpg'}`;
            }

            const savePath = path.join(saveDir, filename);
            const file = fs.createWriteStream(savePath);

            https.get(cleanedUrl, (response) => {
                if (response.statusCode === 200) {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`Successfully downloaded ${filename}`);
                    });
                } else {
                    console.error(`Failed to download ${cleanedUrl} - status code: ${response.statusCode}`);
                    fs.unlink(savePath, () => {});
                }
            }).on('error', (err) => {
                fs.unlink(savePath, () => {});
                console.error(`Error downloading ${cleanedUrl}: ${err.message}`);
            });
        } catch (error) {
            console.error(`Invalid URL: ${cleanedUrl}`);
        }
    });
};

downloadImages('image_urls.txt', 'portfolio_images');
