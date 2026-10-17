'use client';
import { useCallback, useEffect, useState } from 'react';
import { FaSackDollar, FaMoneyBill1Wave, FaMobileScreen, FaCreditCard, FaPrint } from 'react-icons/fa6';
import { supabase, rupee } from '@/lib/supabase';

export default function Accountant() {
  const [orders, setOrders] = useState([]);
  const [paidToday, setPaidToday] = useState([]);

  const load = useCallback(async () => {
    const o = await supabase.from('orders')
      .select('*, order_items(*), dining_tables(label, link_group, id)')
      .eq('status', 'served').order('created_at');
    setOrders(o.data || []);
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const p = await supabase.from('orders').select('total, payment_method')
      .eq('status', 'paid').gte('created_at', start.toISOString());
    setPaidToday(p.data || []);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('acct')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  // Bills are grouped by link_group, so linked tables are billed together
  const bills = {};
  orders.forEach((o) => {
    const key = o.dining_tables?.link_group || o.dining_tables?.id;
    bills[key] = bills[key] || { key, labels: new Set(), orders: [], total: 0 };
    bills[key].labels.add(o.dining_tables?.label);
    bills[key].orders.push(o);
    bills[key].total += Number(o.total);
  });

  async function pay(bill, method) {
    await supabase.from('orders').update({ status: 'paid', payment_method: method }).in('id', bill.orders.map((o) => o.id));
    load();
  }

  const sum = (m) => paidToday.filter((p) => !m || p.payment_method === m).reduce((s, p) => s + Number(p.total), 0);

  return (
    <>
      <div className="grid c4" style={{ marginBottom: 20 }}>
        <div className="card"><small>Collected today</small><div className="stat">{rupee(sum())}</div></div>
        <div className="card"><small>Cash</small><div className="stat">{rupee(sum('cash'))}</div></div>
        <div className="card"><small>UPI</small><div className="stat">{rupee(sum('upi'))}</div></div>
        <div className="card"><small>Card</small><div className="stat">{rupee(sum('card'))}</div></div>
      </div>

      <h2><FaSackDollar className="icon" /> Bills to collect ({Object.keys(bills).length})</h2>
      <div className="grid c3">
        {Object.keys(bills).length === 0 && <div className="info">No served orders waiting for payment.</div>}
        {Object.values(bills).map((b) => (
          <div className="ticket" key={b.key}>
            <h3><span>{[...b.labels].join(' + ')}</span><strong>{rupee(b.total)}</strong></h3>
            <ul>{b.orders.flatMap((o) => o.order_items).map((i) => <li key={i.id}>{i.name} x {i.qty}</li>)}</ul>
            <div className="actions">
              <button className="btn small" onClick={() => pay(b, 'cash')}><FaMoneyBill1Wave /> Cash</button>
              <button className="btn small" onClick={() => pay(b, 'upi')}><FaMobileScreen /> UPI</button>
              <button className="btn small" onClick={() => pay(b, 'card')}><FaCreditCard /> Card</button>
            </div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 20 }}>
        <button className="btn ghost small no-print" onClick={() => window.print()}><FaPrint /> Print day summary</button>
      </p>
    </>
  );
}
