import React from 'react';
import { Order, Customer, AppSettings, Store } from '../types';

interface ReceiptProps {
    order: Order;
    customer?: Customer;
    settings: AppSettings;
    store?: Store;
}

export const Receipt: React.FC<ReceiptProps> = ({ order, customer, settings, store }) => {
    const formatTime = (timeStr: string) => {
        if (!timeStr) return 'N/A';
        const [h, m] = timeStr.split(':');
        const hr = parseInt(h);
        const ampm = hr >= 12 ? 'PM' : 'AM';
        const hr12 = hr % 12 || 12;
        return `${hr12}:${m} ${ampm}`;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        // If it's just a date string (YYYY-MM-DD), parse as local to avoid UTC shift
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const companyName = store?.name || settings.companyName;
    const companyAddress = store?.address || settings.companyAddress;
    const companyPhone = store?.phone || settings.companyPhone;

    return (
        <div className="text-black p-2 space-y-4 w-[270px] mx-auto print:text-black bg-white overflow-hidden">
            <div className="text-center border-b-2 border-dashed border-black pb-4">
                <h1 className="text-2xl font-black uppercase tracking-tighter text-black">{companyName}</h1>
                <p className="text-[9px] font-bold uppercase tracking-widest text-black">Main Store: {companyAddress}</p>
                <p className="text-[9px] font-medium text-black">{companyPhone}</p>
            </div>

            <div className="flex justify-between py-2 border-b border-black">
                <div>
                    <p className="text-[10px] font-bold uppercase text-black opacity-60">Order #</p>
                    <h2 className="text-2xl font-black text-black">{order.orderNumber}</h2>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-black opacity-60">Received</p>
                    <p className="text-xs font-bold text-black">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-black opacity-60">Customer</p>
                <p className="text-xl font-black text-black">{order.customerName}</p>
                {customer && <p className="text-xs font-bold text-black">{customer.phone}</p>}
            </div>

            <div className="border-2 border-black p-3 rounded text-center">
                <p className="text-[10px] font-bold uppercase text-black opacity-70">Ready for Pickup</p>
                <p className="text-xl font-black uppercase text-black">{formatDate(order.pickupDate)} @ {formatTime(order.pickupTime)}</p>
            </div>

            {order.hangerNumber && (
                <div className="text-center bg-slate-100 p-2 rounded">
                    <p className="text-[10px] font-black uppercase opacity-60">Hanger Number</p>
                    <p className="text-2xl font-black">{order.hangerNumber}</p>
                </div>
            )}

            <div className="space-y-2 border-t border-black pt-4">
                <div className="flex justify-between text-[10px] font-black uppercase border-b border-black pb-1">
                    <span className="text-black">Description</span>
                    <span className="text-black">Total</span>
                </div>
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-medium border-b border-dotted border-black pb-1">
                        <span className="text-black">{item.quantity}x {item.category} ({item.serviceType})</span>
                        <span className="font-bold text-black">${item.total.toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <div className="space-y-1 pt-2">
                <div className="flex justify-between text-xs text-black"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs text-black"><span>Tax</span><span>${order.tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-xl font-black border-t-2 border-black pt-1 text-black"><span>TOTAL</span><span>${order.total.toFixed(2)}</span></div>
            </div>

            {order.specialHandling && (
                <div className="p-2 border-2 border-black rounded mt-4">
                    <p className="text-[10px] font-black uppercase mb-1 text-black">Special Handling</p>
                    <p className="text-xs font-bold text-black">{order.specialHandling}</p>
                </div>
            )}

            <div className="pt-8 text-center space-y-4">
                <div className="font-barcode text-6xl opacity-100 text-black whitespace-nowrap" style={{ fontFamily: '"Libre Barcode 128", cursive', fontSize: '60pt', display: 'inline-block', minWidth: '100%' }}>{order.orderNumber}</div>
                <p className="text-[8px] uppercase font-bold tracking-widest text-black px-4 leading-tight">No refund without ticket. Orders donated after 90 days.</p>
            </div>
        </div>
    );
};
