import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScan: (decodedText: string) => void;
    fps?: number;
    qrbox?: number;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, fps = 10, qrbox = 250 }) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Unique ID to avoid conflicts
        const scannerId = 'scanner-reader-view';
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        const startScanner = async () => {
            try {
                // Double check it's not already running
                if (scanner.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
                    await scanner.stop();
                }

                await scanner.start(
                    { facingMode: 'environment' },
                    {
                        fps,
                        qrbox: { width: qrbox, height: qrbox },
                        aspectRatio: 1.0,
                        formatsToSupport: [
                            Html5QrcodeSupportedFormats.CODE_128,
                            Html5QrcodeSupportedFormats.EAN_13,
                            Html5QrcodeSupportedFormats.QR_CODE
                        ]
                    },
                    (decodedText) => {
                        onScan(decodedText);
                    },
                    () => { } // Ignore verbose log
                );
                setIsInitializing(false);
            } catch (err: any) {
                console.error('Failed to start scanner:', err);
                // Fallback or more descriptive error
                if (err?.includes?.('NotFound') || err?.name === 'NotFoundError') {
                    setError('No camera found on this device.');
                } else if (err?.includes?.('Permission') || err?.name === 'NotAllowedError') {
                    setError('Camera permission denied.');
                } else {
                    setError('Could not access camera.');
                }
                setIsInitializing(false);
            }
        };

        // Minor delay to ensure DOM is ready and stable
        const timer = setTimeout(startScanner, 100);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                const state = scannerRef.current.getState();
                if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
                    scannerRef.current.stop()
                        .then(() => scannerRef.current?.clear())
                        .catch(e => console.warn('Safe stop failed:', e));
                } else {
                    try {
                        scannerRef.current.clear();
                    } catch (e) {
                        // Ignore clear if already cleared
                    }
                }
            }
        };
    }, [onScan, fps, qrbox]);

    return (
        <div className="relative w-full max-w-md mx-auto aspect-square overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-black shadow-lg">
            <div id="scanner-reader-view" className="w-full h-full" />

            {isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white z-10">
                    <div className="animate-spin text-primary mb-4">
                        <span className="material-symbols-outlined text-4xl">progress_activity</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest">Starting Camera...</p>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-6 text-center z-20">
                    <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
                    <p className="text-sm font-medium text-white mb-2">{error}</p>
                    <p className="text-xs text-slate-400">Please check camera permissions or try manual entry.</p>
                </div>
            )}

            {!isInitializing && !error && (
                <div className="absolute inset-0 pointer-events-none border-[2px] border-primary/30 m-8 rounded-xl">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />

                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/50 animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
