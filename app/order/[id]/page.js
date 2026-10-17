'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FaReceipt, FaKitchenSet, FaFire, FaBellConcierge, FaPlateWheat, FaCircleCheck, FaWhatsapp,
  FaMobileScreen, FaUtensils, FaPlus,
} from 'react-icons/fa6';
import { supabase, RESTAURANT, UPI_ID, rupee } from '@/lib/supabase';

const STEPS = [
  ['placed', 'Order placed', FaReceipt],
  ['preparing', 'Preparing', FaFire],
  ['ready', 'Ready', FaBellConcierge],
  ['served', 'Served', FaPlateWheat],
  ['paid', 'Paid', FaCircleCheck],
];

export default function OrderPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let live = true;
    async function load() {
      const { data, error } = await supabase.rpc('get_order', { p_id: id });
      if (!live) return;
      if (error || !data) setErr('Order not found.'); else { setOrder(data); setErr(''); }
    }
    load();
    const timer = setInterval(load, 5000);
    return () => { live = false; clearInterval(timer); };
  }, [id]);

  if (err) return <div className="app"><div className="notice">{err}</div></div>;
  if (!order) return <div className="app"><div className="info">Loading your order...</div></div>;

  const idx = STEPS.findIndex(([k]) => k === order.status);
  const text = [
    `${RESTAURANT} - Receipt`,
    `${order.table} | Order ${String(order.id).slice(0, 8)}`,
    ...order.items.map((i) => `${i.name} x ${i.qty} = ${rupee(i.price * i.qty)}`),
    `Total: ${rupee(order.total)}`,
  ].join('\n');
  const upi = UPI_ID
    ? `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(RESTAURANT)}&am=${order.total}&cu=INR`
    : null;

  return (
    <div className="app">
      <div className="topbar"><h1><FaUtensils className="icon" /> {RESTAURANT}</h1></div>
      <h2>Order status</h2>
      <div className="progress">
        {STEPS.map(([k, label, Icon], i) => (
          <div key={k} className={`pstep ${i < idx ? 'done' : ''} ${i === idx ? (idx === STEPS.length - 1 ? 'done' : 'now') : ''}`}>
            <div className="dot"><Icon /></div>{label}
          </div>
        ))}
      </div>

      <div className="receipt">
        <h3><FaReceipt className="icon" /> Digital receipt</h3>
        <small>{order.table} &middot; {new Date(order.created_at).toLocaleString()}</small>
        <div style={{ marginTop: 10 }}>
          {order.items.map((i, n) => (
            <div className="row" key={n}><span>{i.name} x {i.qty}</span><span>{rupee(i.price * i.qty)}</span></div>
          ))}
          <div className="row total"><span>Total</span><span>{rupee(order.total)}</span></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
          <FaWhatsapp /> Send receipt on WhatsApp
        </a>
        {upi && order.status !== 'paid' && (
          <a className="btn alt" href={upi}><FaMobileScreen /> Pay with UPI</a>
        )}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>
        Keep this page open. It refreshes by itself. Want more food? Scan the table QR again to add items.
      </p>
      <Link href="/" className="btn ghost small"><FaPlus /> About QR Dine</Link>
    </div>
  );
}
