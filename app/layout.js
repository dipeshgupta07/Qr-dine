import './globals.css';
import { RESTAURANT } from '@/lib/supabase';

export const metadata = {
  title: 'QR Dine - Restaurant Operations, Simplified',
  description: 'QR based digital ordering, kitchen, waiter and billing system for restaurants.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
