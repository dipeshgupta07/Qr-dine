'use client';
import { useCallback, useEffect, useState } from 'react';
import { FaFire, FaBellConcierge, FaBoxesStacked, FaClock } from 'react-icons/fa6';
import { supabase, tr, rupee } from '@/lib/supabase';

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), dining_tables(label)')
      .in('status', ['placed', 'preparing'])
      .order('created_at');
    setOrders(data || []);
    const m = await supabase.from('menu_items').select('*').order('category').order('price');
    setMenu(m.data || []);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('kitchen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const setStatus = async (id, status) => { await supabase.from('orders').update({ status }).eq('id', id); load(); };
  const toggle = async (m) => {
    await supabase.from('menu_items').update({ in_stock: !m.in_stock, stock_qty: m.in_stock ? 0 : Math.max(m.stock_qty, 10) }).eq('id', m.id);
    load();
  };
  const setQty = async (m, qty) => {
    const q = Math.max(0, Number(qty) || 0);
    await supabase.from('menu_items').update({ stock_qty: q, in_stock: q > 0 }).eq('id', m.id);
    load();
  };

  return (
    <>
      <h2><FaFire className="icon" /> Live orders ({orders.length})</h2>
      <div className="grid c3">
        {orders.length === 0 && <div className="info">No active orders.</div>}
        {orders.map((o) => (
          <div className="ticket" key={o.id}>
            <h3><span>{o.dining_tables?.label}</span>
              <span className={`badge ${o.status === 'placed' ? 'warn' : 'ok'}`}>{o.status}</span></h3>
            <small><FaClock className="icon" /> {new Date(o.created_at).toLocaleTimeString()}</small>
            <ul>{o.order_items.map((i) => <li key={i.id}>{i.name} x {i.qty}</li>)}</ul>
            <div className="actions">
              {o.status === 'placed' && <button className="btn small" onClick={() => setStatus(o.id, 'preparing')}><FaFire /> Start cooking</button>}
              <button className="btn alt small" onClick={() => setStatus(o.id, 'ready')}><FaBellConcierge /> Mark ready</button>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 32 }}><FaBoxesStacked className="icon" /> Stock management</h2>
      <table className="table">
        <thead><tr><th>Item</th><th>Price</th><th>Stock qty</th><th>Status</th></tr></thead>
        <tbody>
          {menu.map((m) => (
            <tr key={m.id}>
              <td>{tr(m.name, 'en')}</td>
              <td>{rupee(m.price)}</td>
              <td><input className="input" style={{ width: 90 }} type="number" min="0" defaultValue={m.stock_qty} key={m.stock_qty}
                onBlur={(e) => Number(e.target.value) !== m.stock_qty && setQty(m, e.target.value)} /></td>
              <td><button className={`btn small ${m.in_stock ? '' : 'danger'}`} onClick={() => toggle(m)}>
                {m.in_stock ? 'Available' : 'Out of stock'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
