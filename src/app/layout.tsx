import type { Metadata } from 'next';
import { LangProvider } from '@/context/LangContext';
import Nav from '@/components/Nav';
import LangSyncer from '@/components/LangSyncer';
import './globals.css';

export const metadata: Metadata = {
  title: 'BE/OND — Ready to Wear',
  description:
    'BE/OND is a ready-to-wear label working out of one atelier in Istanbul. Hazır giyim.',
  // Stop mobile browsers from auto-linking phone numbers/addresses into <a>
  // tags before React hydrates — that DOM rewrite caused a hydration mismatch
  // in the Contact section's plain-text phone numbers.
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink antialiased">
        <LangProvider>
          <LangSyncer />
          <Nav />
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
