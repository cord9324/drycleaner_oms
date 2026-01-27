import { supabase } from './supabase';

// The certificate content we generated earlier. 
// In a real prod environment, this could be fetched from a DB or environmental variable,
// but since it's the PUBLIC part, it's safe to include or fetch as a static asset.
const QZ_CERTIFICATE = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyYtKzQJ+5rQY+QvI9Z/r
... (Content will be populated or fetched) ...
-----END PUBLIC KEY-----`;

// Note: For now, we define a function to load the cert content from our local files
// Or we can just embed the public key string here since it was generated.

declare const qz: any;

export async function setupQZSecurity() {
    try {
        const res = await fetch('/qz-digital-certificate.txt');
        if (!res.ok) throw new Error("Certificate file not found");
        const cert = await res.text();
        if (!cert.includes("BEGIN CERTIFICATE")) throw new Error("Invalid certificate format");

        console.log("QZ Security: Certificate loaded, enabling signatures.");

        // 1. Set the certificate
        qz.security.setCertificatePromise((resolve: any) => resolve(cert));

        // 2. Set the signature promise
        qz.security.setSignaturePromise((toSign: string, algorithm: string) => {
            return (resolve: any, reject: any) => {
                const algo = algorithm || 'SHA1'; // Fallback to SHA1 if undefined
                console.log(`QZ Security: Signing request with Algorithm: ${algo}`);
                console.log(`Message to sign: "${toSign}"`);

                // Use an IIFE to handle async/await safely inside the promise callback
                (async () => {
                    try {
                        const { data: { session } } = await supabase.auth.getSession();

                        const { data, error } = await supabase.functions.invoke('qz-sign', {
                            body: { message: toSign, algorithm: algo },
                            headers: {
                                Authorization: `Bearer ${session?.access_token || ''}`
                            }
                        });

                        if (error) {
                            console.error("QZ Signing: Edge Function Error:", error);
                            reject(error);
                        } else if (!data?.signature) {
                            console.error("QZ Signing: No signature returned from function.");
                            reject(new Error("No signature returned"));
                        } else {
                            console.log("QZ Security: Signature received.");
                            resolve(data.signature);
                        }
                    } catch (err) {
                        console.error("QZ Signing: Unexpected failure:", err);
                        reject(err);
                    }
                })();
            };
        });
    } catch (err) {
        console.warn("QZ Security: Skipping digital signatures (Certificate missing or invalid). Silent printing will require manual confirmation.", err);
    }
}
