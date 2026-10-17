'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FaUtensils, FaPlus, FaMinus, FaCartShopping, FaBell, FaGlassWater, FaReceipt, FaCircleCheck,
  FaCircleXmark, FaHandHoldingHand, FaTriangleExclamation,
} from 'react-icons/fa6';
import { supabase, RESTAURANT, LANGUAGES, tr, rupee } from '@/lib/supabase';

const UI = {
  en: { cart: 'View cart', place: 'Place order', total: 'Total', phone: 'Phone for WhatsApp receipt (optional)', avail: 'Available', out: 'Out of stock', call: 'Need something?', all: 'All' },
  hi: { cart: 'कार्ट देखें', place: 'ऑर्डर करें', total: 'कुल', phone: 'WhatsApp रसीद के लिए फोन (वैकल्पिक)', avail: 'उपलब्ध', out: 'स्टॉक खत्म', call: 'कुछ चाहिए?', all: 'सभी' },
  bn: { cart: 'কার্ট দেখুন', place: 'অর্ডার করুন', total: 'মোট', phone: 'WhatsApp রসিদের জন্য ফোন (ঐচ্ছিক)', avail: 'পাওয়া যাচ্ছে', out: 'স্টক শেষ', call: 'কিছু লাগবে?', all: 'সব' },
  ta: { cart: 'கார்ட்', place: 'ஆர்டர் செய்', total: 'மொத்தம்', phone: 'WhatsApp ரசீதுக்கு தொலைபேசி', avail: 'கிடைக்கும்', out: 'தீர்ந்தது', call: 'ஏதாவது வேண்டுமா?', all: 'அனைத்தும்' },
  te: { cart: 'కార్ట్', place: 'ఆర్డర్ చేయండి', total: 'మొత్తం', phone: 'WhatsApp రసీదు కోసం ఫోన్', avail: 'అందుబాటులో', out: 'స్టాక్ లేదు', call: 'ఏదైనా కావాలా?', all: 'అన్నీ' },
};

export default function CustomerMenu() {
  const { tableId } = useParams();
  const router = useRouter();
  const [lang, setLang] = useState('en');
  const [table, setTable] = useState(null);
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState('ALL');
  const [cart, setCart] = useState({});
  const [phone, setPhone] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const t = UI[lang] || UI.en;

  // "demo" opens the first table so the landing page demo works
  useEffect(() => {
    (async () => {
      let q = supabase.from('dining_tables').select('*');
      q = tableId === 'demo' ? q.order('label').limit(1) : q.eq('id', tableId);
      const { data, error: e } = await q;
      if (e || !data?.length) setError('This table could not be found. Please scan the QR again.');
      else setTable(data[0]);
    })();
  }, [tableId]);

  async function loadMenu() {
    const { data } = await supabase.from('menu_items').select('*').order('category').order('price');
    setItems(data || []);
  }

  useEffect(() => {
    loadMenu();
    const ch = supabase
      .channel('menu-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, loadMenu)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const cats = useMemo(() => ['ALL', ...new Set(items.map((i) => i.category))], [items]);
  const shown = items.filter((i) => cat === 'ALL' || i.category === cat);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = items.reduce((s, i) => s + (cart[i.id] || 0) * Number(i.price), 0);

  function change(item, d) {
    setCart((c) => {
      const next = Math.max(0, Math.min(item.stock_qty, (c[item.id] || 0) + d));
      const copy = { ...c, [item.id]: next };
      if (!next) delete copy[item.id];
      return copy;
    });
  }

  async function placeOrder() {
    setBusy(true); setError('');
    const payload = Object.entries(cart).map(([id, qty]) => ({ id, qty }));
    const { data, error: e } = await supabase.rpc('place_order', {
      p_table: table.id, p_items: payload, p_phone: phone.trim() || null,
    });
    setBusy(false);
    if (e) { setError(e.message); loadMenu(); return; }
    try { localStorage.setItem('qrdine_last_order', data); } catch {}
    router.push(`/order/${data}`);
  }

  async function request(kind) {
    const { error: e } = await supabase.from('service_requests').insert({ table_id: table.id, kind });
    setToast(e ? 'Could not send request. Please try again.' : 'Request sent. A waiter will be with you shortly.');
    setTimeout(() => setToast(''), 4000);
  }

  return (
    <div className="app">
      <div className="topbar">
        <h1><FaUtensils className="icon" /> {RESTAURANT}</h1>
        <select className="select" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>
      {table && <div className="info"><strong>{table.label}</strong></div>}
      {error && <div className="notice"><FaTriangleExclamation className="icon" /> {error}</div>}
      {toast && <div className="info">{toast}</div>}

      <div className="cat-tabs">
        {cats.map((c) => (
          <button key={c} className={`cat-tab ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
            {c === 'ALL' ? t.all : c}
          </button>
        ))}
      </div>

      {shown.map((i) => {
        const out = !i.in_stock || i.stock_qty <= 0;
        return (
          <div className="item" key={i.id} style={{ opacity: out ? 0.6 : 1 }}>
            <div className="meta">
              <div className="name">{tr(i.name, lang)}</div>
              <div className="desc">{tr(i.description, lang)}</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 10, alignItems: 'center' }}>
                <strong>{rupee(i.price)}</strong>
                {out ? (
                  <span className="badge out"><FaCircleXmark /> {t.out}</span>
                ) : i.stock_qty <= 5 ? (
                  <span className="badge warn">Only {i.stock_qty} left</span>
                ) : (
                  <span className="badge ok"><FaCircleCheck /> {t.avail}</span>
                )}
              </div>
            </div>
            {!out && (
              <div className="qty">
                {cart[i.id] ? (
                  <>
                    <button onClick={() => change(i, -1)} aria-label="Remove one"><FaMinus /></button>
                    <strong>{cart[i.id]}</strong>
                    <button onClick={() => change(i, 1)} aria-label="Add one"><FaPlus /></button>
                  </>
                ) : (
                  <button onClick={() => change(i, 1)} aria-label="Add"><FaPlus /></button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 24 }}>
        <strong>{t.call}</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button className="btn ghost small" onClick={() => request('water')}><FaGlassWater /> Water</button>
          <button className="btn ghost small" onClick={() => request('napkin')}><FaHandHoldingHand /> Napkins</button>
          <button className="btn ghost small" onClick={() => request('bill')}><FaReceipt /> Bill</button>
          <button className="btn ghost small" onClick={() => request('help')}><FaBell /> Call waiter</button>
        </div>
      </div>

      {count > 0 && (
        <div className="cartbar">
          <div className="inner">
            <div><strong>{count}</strong> items &nbsp; <strong>{rupee(total)}</strong></div>
            <button className="btn" onClick={() => setShowCart(true)}><FaCartShopping /> {t.cart}</button>
          </div>
        </div>
      )}

      {showCart && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 720, margin: '0 auto', borderRadius: '18px 18px 0 0', padding: 20, maxHeight: '85vh', overflow: 'auto' }}>
            <h2>{t.cart}</h2>
            {items.filter((i) => cart[i.id]).map((i) => (
              <div className="receipt" style={{ marginBottom: 8 }} key={i.id}>
                <div className="row"><span>{tr(i.name, lang)} x {cart[i.id]}</span><strong>{rupee(i.price * cart[i.id])}</strong></div>
              </div>
            ))}
            <div className="row" style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0', fontSize: 18 }}>
              <span>{t.total}</span><strong>{rupee(total)}</strong>
            </div>
            <input className="input" placeholder={t.phone} value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ''))} inputMode="tel" />
            {error && <div className="notice">{error}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="btn ghost" onClick={() => setShowCart(false)}>Back</button>
              <button className="btn" disabled={busy} onClick={placeOrder}>{busy ? 'Placing...' : t.place}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
