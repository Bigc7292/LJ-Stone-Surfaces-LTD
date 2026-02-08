
// Native fetch is available in Node 18+
async function verify() {
    const baseUrl = 'http://localhost:3010';
    console.log('Verifying server at ' + baseUrl + '...');

    // 1. Check Homepage
    try {
        const res = await fetch(baseUrl + '/');
        if (res.ok) {
            console.log('✅ Homepage loaded successfully (' + res.status + ')');
        } else {
            console.error('❌ Homepage failed to load (' + res.status + ')');
            // Don't exit yet, try asset
        }
    } catch (err) {
        console.error('❌ Failed to connect to server:', err.message);
        process.exit(1);
    }

    // 2. Check Static Asset (Stone Texture)
    // Using a path from stoneLibrary3D.ts: /data_science/processed_training_set/Granite001A.png
    const assetPath = '/data_science/processed_training_set/Granite001A.png';
    const assetUrl = baseUrl + assetPath;

    try {
        const res = await fetch(assetUrl);
        if (res.ok) {
            const contentType = res.headers.get('content-type');
            console.log('✅ Stone asset loaded successfully (' + res.status + ')');
            console.log('   Content-Type: ' + contentType);
            if (contentType && contentType.startsWith('image/')) {
                console.log('   Type verified as image.');
            } else {
                console.warn('   ⚠️ Content-Type is not an image! (' + contentType + ')');
            }
        } else {
            console.error('❌ Stone asset 404/Failed (' + res.status + ')');
            console.error('   URL tried: ' + assetUrl);
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Failed to fetch asset:', err.message);
        process.exit(1);
    }

    console.log('\n🎉 ALL CHECKS PASSED. Server is fixed.');
}

verify();
