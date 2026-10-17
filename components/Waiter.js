'use client';
import { useCallback, useEffect, useState } from 'react';
import { FaBellConcierge, FaPlateWheat, FaLink, FaLinkSlash, FaCircleCheck, FaStopwatch } from 'react-icons/fa6';
import { supabase } from '@/lib/supabase';

const SLA_MINUTES = 3;

export default function Waiter() {
  const [ready, setReady] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [tables, setTables] = useState([]);
  const [picked, setPicked] = useState([]);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    const o = await supabase.from('orders').select('*, order_items(*), dining_tables(label)').eq('status', 'ready').order('created_at');
    setReady(o.data || []);
    const r = await supabase.from('service_requests').select('*, dining_tables(label)').eq('status', 'open').order('created_at');
    setReqs(r.data || []);
    const t = await supabase.from('dining_tables').select('*').order('label');
    setTables(t.data || []);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('waiter')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, load)
      .subscribe();
    const tick = setInterval(() => setNow(Date.now()), 15000);
    return () => { supabase.removeChannel(ch); clearInterval(tick); };
  }, [load]);

  const served = async (id) => { await supabase.from('orders').update({ status: 'served' }).eq('id', id); load(); };
  const resolve = async (id) => {
    await supabase.from('service_requests').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id); load();
  };
  const link = async () => {
    if (picked.length < 2) return;
    await supabase.from('dining_tables').update({ link_group: crypto.randomUUID() }).in('id', picked);
    setPicked([]); load();
  };
  const unlink = async (group) => { await supabase.from('dining_tables').update({ link_group: null }).eq('link_group', group); load(); };

  const groups = [...new Set(tables.filter((t) => t.link_group).map((t) => t.link_group))];

  return (
    <>
      <h2><FaBellConcierge className="icon" /> Ready to serve ({ready.length})</h2>
      <div className="grid c3">
        {ready.length === 0 && <div className="info">Nothing waiting.</div>}
        {ready.map((o) => (
          <div className="ticket" key={o.id}>
            <h3>{o.dining_tables?.label}</h3>
            <ul>{o.order_items.map((i) => <li key={i.id}>{i.name} x {i.qty}</li>)}</ul>
            <button className="btn small" onClick={() => served(o.id)}><FaPlateWheat /> Mark served</button>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 32 }}><FaStopwatch className="icon" /> Customer requests ({reqs.length})</h2>
      <div className="grid c3">
        {reqs.length === 0 && <div className="info">No open requests.</div>}
        {reqs.map((r) => {
          const mins = Math.floor((now - new Date(r.created_at).getTime()) / 60000);
          const late = mins >= SLA_MINUTES;
          return (
            <div className={`ticket ${late ? 'sla-late' : ''}`} key={r.id}>
              <h3><span>{r.dining_tables?.label}</span>
                <span className={`badge ${late ? 'out' : 'warn'}`}>{late ? 'SLA breached' : `${mins} min`}</span></h3>
              <p style={{ margin: '6px 0 12px', textTransform: 'capitalize' }}>{r.kind} request, waiting {mins} min</p>
              <button className="btn small" onClick={() => resolve(r.id)}><FaCircleCheck /> Done</button>
            </div>
          );
        })}
      </div>

      <h2 style={{ marginTop: 32 }}><FaLink className="icon" /> Table linking</h2>
      <p style={{ color: 'var(--muted)' }}>Select two or more tables for a family or large group. Linked tables are billed together.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {tables.map((t) => (
          <label key={t.id} className="chip" style={{ background: t.link_group ? '#e3f1ef' : '#fff' }}>
            <input type="checkbox" disabled={!!t.link_group} checked={picked.includes(t.id)}
              onChange={(e) => setPicked((p) => e.target.checked ? [...p, t.id] : p.filter((x) => x !== t.id))} />
            {t.label} {t.link_group && <FaLink />}
          </label>
        ))}
      </div>
      <button className="btn" disabled={picked.length < 2} onClick={link}><FaLink /> Link selected tables</button>
      {groups.map((g) => (
        <div key={g} className="info" style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Linked: {tables.filter((t) => t.link_group === g).map((t) => t.label).join(' + ')}</span>
          <button className="btn small ghost" onClick={() => unlink(g)}><FaLinkSlash /> Unlink</button>
        </div>
      ))}
    </>
  );
}
