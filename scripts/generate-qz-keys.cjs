const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Generates a self-signed X.509 certificate and private key using OpenSSL.
 * Required for QZ Tray silent printing trust.
 */
function generateKeys() {
    const outputDir = path.join(__dirname, '..', 'qz-keys');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    console.log("Generating RSA 2048-bit Private Key and X.509 Certificate...");

    try {
        // 1. Generate Private Key and Self-Signed Certificate in one go
        // -nodes: No passphrase on the key
        // -days 3650: Valid for 10 years
        const subject = "/C=US/ST=State/L=City/O=OMS/CN=localhost";
        // Use double quotes for paths to handle spaces if any
        const keyPath = path.join(outputDir, 'qz-private-key.pem');
        const certPath = path.join(outputDir, 'qz-digital-certificate.txt');
        const tempKeyPath = path.join(outputDir, 'temp.key');

        // 1. Generate Private Key and Self-Signed Certificate
        const command = `openssl req -x509 -newkey rsa:2048 -keyout "${tempKeyPath}" -out "${certPath}" -days 3650 -nodes -subj "${subject}"`;
        execSync(command, { stdio: 'inherit' });

        // 2. Convert key to PKCS#8 format (Required by many modern WebCrypto implementations)
        console.log("Converting key to PKCS#8...");
        execSync(`openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in "${tempKeyPath}" -out "${keyPath}"`);

        // Clean up temp file
        fs.unlinkSync(tempKeyPath);

        console.log(`\nKeys generated successfully in: ${outputDir}`);
        console.log("1. 'qz-private-key.pem' -> ADD THIS TO SUPABASE SECRETS (QZ_PRIVATE_KEY)");
        console.log("2. 'qz-digital-certificate.txt' -> IMPORT THIS INTO QZ TRAY SITE MANAGER");

        // Also copy to public directory for the app to fetch
        const publicDir = path.join(__dirname, '..', 'public');
        if (fs.existsSync(publicDir)) {
            fs.copyFileSync(certPath, path.join(publicDir, 'qz-digital-certificate.txt'));
            console.log("3. Copied certificate to public/qz-digital-certificate.txt");
        }

    } catch (error) {
        console.error("OpenSSL generation failed:", error.message);
    }
}

generateKeys();
