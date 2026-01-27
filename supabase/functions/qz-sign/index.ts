import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Safe Base64 encoding for Binary Data
 */
function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { message, algorithm } = await req.json();
        if (!message) throw new Error("No message to sign");

        const privateKeyPem = Deno.env.get('QZ_PRIVATE_KEY');
        if (!privateKeyPem) throw new Error('QZ_PRIVATE_KEY environment variable is missing');

        const algoName = (algorithm || 'SHA1').toUpperCase();
        const hash = algoName === 'SHA1' ? 'SHA-1' : 'SHA-256';

        console.log(`Signing message (Length: ${message.length}, Algo: ${algoName})`);

        // Diagnostic: Log as HEX to see if whitespaces or special chars are present
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hex = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
        console.log(`HEX Message segment: ${hex.substring(0, 64)}...`);

        const key = await importPrivateKey(privateKeyPem, hash);

        const signatureBuffer = await crypto.subtle.sign(
            "RSASSA-PKCS1-v1_5",
            key,
            data
        );

        const signature = arrayBufferToBase64(signatureBuffer);
        return new Response(JSON.stringify({ signature, algoUsed: algoName }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (err) {
        console.error("Signing Function Error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});

/**
 * Clean PEM and convert to ArrayBuffer
 */
async function importPrivateKey(pem: string, hash: string) {
    const base64 = pem
        .replace(/-----BEGIN .*?PRIVATE KEY-----/g, '')
        .replace(/-----END .*?PRIVATE KEY-----/g, '')
        .replace(/\s+/g, '');

    const binaryDerString = atob(base64);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    return await crypto.subtle.importKey(
        "pkcs8",
        binaryDer.buffer,
        { name: "RSASSA-PKCS1-v1_5", hash: hash },
        false,
        ["sign"]
    );
}
