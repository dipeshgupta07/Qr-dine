'use client';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FaQrcode, FaPrint } from 'react-icons/fa6';
import { supabase, RESTAURANT } from '@/lib/supabase';

export default function QrManager() {
  const [tables, setTables] = useState([]);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    supabase.from('dining_tables').select('*').order('label').then(({ data }) => setTables(data || []));
  }, []);

  return (
    <>
      <h2><FaQrcode className="icon" /> Table QR codes</h2>
      <p style={{ color: 'var(--muted)' }}>
        Print these and place one on each table. They always point to {origin || 'your deployed site'}, so deploy to Vercel before printing.
      </p>
      <button className="btn ghost small no-print" onClick={() => window.print()}><FaPrint /> Print</button>
      <div className="grid c3" style={{ marginTop: 16 }}>
        {tables.map((t) => (
          <div className="qr-card" key={t.id}>
            <h3>{t.label}</h3>
            {origin && <QRCodeSVG value={`${origin}/t/${t.id}`} size={170} />}
            <p style={{ margin: '10px 0 0', fontSize: 13 }}>Scan to see the menu<br />{RESTAURANT}</p>
          </div>
        ))}
      </div>
    </>
  );
}
