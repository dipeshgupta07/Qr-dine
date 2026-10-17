import Link from 'next/link';
import {
  FaQrcode, FaUtensils, FaClock, FaCircleQuestion, FaPeopleGroup, FaReceipt, FaCalculator,
  FaLanguage, FaBell, FaGlobe, FaBoxesStacked, FaBolt, FaCirclePlus, FaWhatsapp, FaLink,
  FaCreditCard, FaUserTie, FaKitchenSet, FaPersonWalking, FaSackDollar, FaUserGear, FaCrown,
  FaCheck, FaArrowRight, FaMobileScreen, FaChartLine, FaRocket, FaPhone, FaEnvelope, FaHandPointer,
  FaBowlFood, FaTableCellsLarge,
} from 'react-icons/fa6';
import { RESTAURANT } from '@/lib/supabase';

const problems = [
  [FaClock, '10 minute waiter wait', 'Customer scans QR and orders in 30 seconds'],
  [FaCircleQuestion, '"Is this available?"', 'Live stock status shown right on the menu'],
  [FaPeopleGroup, 'Family needs 2 tables', 'Tables link together, billing separate or combined'],
  [FaReceipt, 'Paper receipts', 'WhatsApp or digital receipt, accessible for 5 days'],
  [FaCalculator, 'Manual hisaab in a copy-pen', 'Manager dashboard auto-calculates everything'],
  [FaLanguage, 'Language barrier', 'Multi-language menu in 10+ languages'],
  [FaBell, 'Missed requests', 'SLA alarm: respond in 3 minutes or it escalates'],
];

const usp = [
  [FaGlobe, 'Multi-language menu', 'Customers read the menu in their own language.'],
  [FaBoxesStacked, 'Live stock', 'Sold out items cannot be ordered, so no kitchen surprises.'],
  [FaBolt, 'Zero waiter wait', 'Customers place orders on their own phone.'],
  [FaCirclePlus, 'Mid-order add', 'Add more items later without calling a waiter.'],
  [FaWhatsapp, 'WhatsApp receipt', 'Paperless digital receipt, available for days.'],
  [FaBell, 'SLA alarm', 'No customer request is ever ignored.'],
  [FaLink, 'Table linking', 'Smart solution for families and large groups.'],
  [FaCreditCard, 'Digital payment', 'UPI, card and cash all supported.'],
];

const journey = [
  [FaPeopleGroup, 'Customer arrives', 'Sits at a table with a QR stand.'],
  [FaQrcode, 'Scans the QR', 'Opens the menu, no app install.'],
  [FaLanguage, 'Picks a language', 'English, Hindi, Bengali, Tamil, Telugu and more.'],
  [FaBoxesStacked, 'Sees live menu', 'Available and out of stock items are clear.'],
  [FaHandPointer, 'Places the order', 'Selects items and confirms.'],
  [FaKitchenSet, 'Kitchen gets a ticket', 'Food preparation starts instantly.'],
  [FaPersonWalking, 'Waiter serves', 'Notified when the order is ready.'],
  [FaBowlFood, 'Customer eats', 'Can add more items from the phone.'],
  [FaCreditCard, 'Pays by UPI or cash', 'Bill is ready the moment they ask.'],
  [FaWhatsapp, 'Receipt arrives', 'Digital receipt on WhatsApp.'],
  [FaTableCellsLarge, 'Table is free', 'Next customer is ready to be seated.'],
];

const roles = [
  [FaMobileScreen, 'Customer', 'QR scan, menu, order, tracking and digital receipt.'],
  [FaKitchenSet, 'Kitchen Staff', 'Live orders, stock management, order ready marking.'],
  [FaPersonWalking, 'Waiter', 'Table handling, serving, requests and table linking.'],
  [FaSackDollar, 'Accountant', 'Payment collection, billing and day close.'],
  [FaUserGear, 'Manager', 'QR codes, menu and stock control, reports.', true],
  [FaCrown, 'Owner', 'Multi-branch analytics and profit reports.', true],
];

const phases = [
  ['p1', 'Phase 1', 'In Progress', 'Staff Ops Panel', 'Kitchen, Waiter, Accountant'],
  ['p2', 'Phase 2', 'Next', 'Customer Panel', 'QR scan, multi-language, ordering'],
  ['p3', 'Phase 3', '', 'Manager Panel', 'Leave, salary, reports'],
  ['p4', 'Phase 4', '', 'Owner Panel', 'Multi-branch analytics'],
  ['p5', 'Phase 5', '', 'Integrations', 'Swiggy, Zomato, loyalty, payments'],
];

export default function Home() {
  return (
    <>
      <header className="nav">
        <div className="container">
          <Link href="/" className="logo"><FaUtensils className="icon" /> QR DINE</Link>
          <nav className="nav-links">
            <a href="#problem" className="hide-sm">Problem</a>
            <a href="#solution" className="hide-sm">Solution</a>
            <a href="#usp" className="hide-sm">Features</a>
            <a href="#roadmap" className="hide-sm">Roadmap</a>
            <Link href="/staff" className="btn small">Staff Login</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>Restaurant ka kaam easy karne wala digital system</h1>
            <p className="lead">Smart restaurant, happy customers, better business. Scan, order, eat and pay without waiting.</p>
            <div className="oneline">
              Customer QR scan kare, apni bhasha me menu dekhe, bina waiter ko wait kiye order kare, aur WhatsApp pe digital receipt paaye.
            </div>
            <div className="chips">
              <span className="chip"><FaCheck className="icon" /> No app install</span>
              <span className="chip"><FaCheck className="icon" /> Live stock</span>
              <span className="chip"><FaCheck className="icon" /> 5 languages and growing</span>
            </div>
            <Link href="/t/demo" className="btn alt"><FaQrcode /> Try the customer demo <FaArrowRight /></Link>{' '}
            <Link href="/staff" className="btn ghost">Open staff panel</Link>
          </div>
          <div>
            <div className="phone">
              <div className="screen">
                <strong>Table 5</strong><br />
                <small>Scan to see the menu</small>
                <div className="qr"><FaQrcode size={120} color="#0f4c4a" /></div>
                <small>{RESTAURANT}</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="block" id="problem">
        <div className="container">
          <h2 className="section-title">Aaj restaurant me kya problem hai?</h2>
          <p className="section-sub">Every restaurant loses time and money to the same seven problems.</p>
          <div className="grid c3">
            {problems.map(([Icon, p]) => (
              <div className="card" key={p}>
                <div className="ic"><Icon /></div>
                <h3>{p}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block alt" id="solution">
        <div className="container">
          <h2 className="section-title">QR Dine ye sab solve karta hai</h2>
          <p className="section-sub">Every problem has a direct answer.</p>
          <div className="pairs">
            <div className="pair head"><span>Problem</span><span className="arrow"><FaArrowRight /></span><span>QR Dine solution</span></div>
            {problems.map(([Icon, p, s]) => (
              <div className="pair" key={p}>
                <span className="prob"><Icon className="icon" /> {p}</span>
                <span className="arrow"><FaArrowRight /></span>
                <span className="sol">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block" id="usp">
        <div className="container">
          <h2 className="section-title">USP: kya alag hai?</h2>
          <p className="section-sub">Eight things that set QR Dine apart.</p>
          <div className="grid c4">
            {usp.map(([Icon, t, d]) => (
              <div className="card" key={t}>
                <div className="ic"><Icon /></div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block alt" id="journey">
        <div className="container">
          <h2 className="section-title">Ek example: customer ki journey</h2>
          <p className="section-sub">Total time saved: 15 to 20 minutes per customer.</p>
          <div className="steps">
            {journey.map(([Icon, t, d], i) => (
              <div className="step" key={t}>
                <span className="n">{i + 1}</span>
                <div className="ic"><Icon /></div>
                <strong>{t}</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 14 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block" id="roles">
        <div className="container">
          <h2 className="section-title">Kaun kaun use karega?</h2>
          <p className="section-sub">Six roles, each with its own panel.</p>
          <div className="grid c3">
            {roles.map(([Icon, t, d, future]) => (
              <div className="card" key={t}>
                <div className="ic"><Icon /></div>
                <h3>{t}{future && <span className="future">Future phase</span>}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block alt" id="roadmap">
        <div className="container">
          <h2 className="section-title"><FaRocket className="icon" /> Current status and roadmap</h2>
          <p className="section-sub">Built in phases so every release is usable.</p>
          <div className="roadmap">
            {phases.map(([c, p, st, t, d]) => (
              <div className={`phase ${c}`} key={p}>
                <h4>{p}{st && ` (${st})`}</h4>
                <strong>{t}</strong><br />
                <small>{d}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block" id="contact">
        <div className="container" style={{ maxWidth: 560 }}>
          <h2 className="section-title">Contact</h2>
          <div className="card">
            <p><FaUserTie className="icon" /> Name: Dipesh</p>
            <p><FaPhone className="icon" /> Phone: add your number</p>
            <p><FaEnvelope className="icon" /> Email: add your email</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="logo"><FaUtensils className="icon" /> QR Dine</div>
          <div>Restaurant Operations, Simplified.</div>
        </div>
      </footer>
    </>
  );
}
