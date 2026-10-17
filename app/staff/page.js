'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaUtensils, FaKitchenSet, FaPersonWalking, FaSackDollar, FaQrcode, FaRightFromBracket, FaLock,
} from 'react-icons/fa6';
import { supabase } from '@/lib/supabase';
import Kitchen from '@/components/Kitchen';
import Waiter from '@/components/Waiter';
import Accountant from '@/components/Accountant';
import QrManager from '@/components/QrManager';

const PANELS = {
  kitchen: ['Kitchen', FaKitchenSet, Kitchen],
  waiter: ['Waiter', FaPersonWalking, Waiter],
  accountant: ['Accountant', FaSackDollar, Accountant],
  qr: ['QR Codes', FaQrcode, QrManager],
};
const ACCESS = {
  kitchen: ['kitchen'],
  waiter: ['waiter'],
  accountant: ['accountant'],
  manager: ['kitchen', 'waiter', 'accountant', 'qr'],
  owner: ['kitchen', 'waiter', 'accountant', 'qr'],
};

export default function StaffHome() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle().then(({ data }) => {
      setProfile(data || { missing: true });
      if (data) setTab(ACCESS[data.role][0]);
    });
  }, [session]);

  async function login(e) {
    e.preventDefault(); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
  }

  if (session === undefined) return <div className="app"><div className="info">Loading...</div></div>;

  if (!session) {
    return (
      <form className="login card" onSubmit={login}>
        <h2><FaLock className="icon" /> Staff login</h2>
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div className="notice">{error}</div>}
        <button className="btn" type="submit">Sign in</button>
        <p><Link href="/" style={{ color: 'var(--brand)' }}>Back to home</Link></p>
      </form>
    );
  }

  if (profile?.missing) {
    return (
      <div className="app">
        <div className="notice">
          Your account has no staff role yet. Ask the manager to add your user id ({session.user.id}) to the profiles table.
        </div>
        <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    );
  }
  if (!profile || !tab) return <div className="app"><div className="info">Loading...</div></div>;

  const allowed = ACCESS[profile.role];
  const Panel = PANELS[tab][2];

  return (
    <div className="app wide">
      <div className="topbar">
        <h1><FaUtensils className="icon" /> Staff panel &middot; {profile.role}</h1>
        <button className="btn ghost small" onClick={() => supabase.auth.signOut()}><FaRightFromBracket /> Sign out</button>
      </div>
      <div className="tabs">
        {allowed.map((k) => {
          const [label, Icon] = PANELS[k];
          return <button key={k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}><Icon /> {label}</button>;
        })}
      </div>
      <Panel role={profile.role} />
    </div>
  );
}
