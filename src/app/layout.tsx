import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dublymarket',
  description: 'What healer will Dub play next season?',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
