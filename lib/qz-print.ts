import { Store, Order, AppSettings, Customer } from '../types';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Receipt } from '../components/Receipt';

// Declare QZ globally since we're using the script tag
declare const qz: any;

class QZService {
    private connected = false;

    async connect() {
        if (this.connected && qz.websocket.isActive()) return;
        try {
            console.log("Connecting to QZ Tray...");
            if (!qz.websocket.isActive()) {
                await qz.websocket.connect();
            }
            this.connected = true;
            console.log("Connected to QZ Tray.");
        } catch (e) {
            console.error("QZ Tray connection failed. Is it running?", e);
            throw e;
        }
    }

    async getPrinters(): Promise<string[]> {
        try {
            await this.connect();
            const printers = await qz.printers.find();
            console.log("Available printers:", printers);
            return printers;
        } catch (e) {
            console.error("Failed to fetch printers:", e);
            return [];
        }
    }

    async printReceipt(order: Order, store: Store, settings: AppSettings, customer?: Customer) {
        console.log(`Attempting silent print for Order ${order.orderNumber} at Store ${store.name}`);
        if (!store.qzEnabled) {
            console.log("Silent printing is disabled for this store.");
            return;
        }

        try {
            await this.connect();

            const printer = localStorage.getItem(`qz_printer_override_${store.id}`) || store.qzPrinterName || "Receipt";
            console.log(`Using printer: ${printer}`);
            const config = qz.configs.create(printer);

            // Render the Receipt component to an HTML string
            console.log("Rendering receipt HTML...");
            const receiptHtml = renderToString(
                React.createElement(Receipt, { order, settings, customer, store })
            );

            const data = [
                {
                    type: 'html',
                    format: 'plain',
                    data: `
            <html>
              <head>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Libre+Barcode+128&display=swap" rel="stylesheet">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  body { font-family: 'Inter', sans-serif; background: white; margin: 0; padding: 0; width: 270px; overflow: hidden; }
                  .font-barcode { font-family: 'Libre Barcode 128', cursive !important; white-space: nowrap !important; }
                  * { color: black !important; -webkit-print-color-adjust: exact; }
                </style>
              </head>
              <body>
                ${receiptHtml}
              </body>
            </html>
          `
                }
            ];

            console.log("Sending job to QZ Tray...");
            await qz.print(config, data);
            console.log("Print job sent successfully.");
        } catch (e) {
            console.error("Silent printing failed:", e);
        }
    }
}

export const qzService = new QZService();
