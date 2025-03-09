import './globals.css'
import '@/styles/cybr-btn.css'
import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  display: 'swap'
});

export const metadata: Metadata = {
  title: {
    template: '%s | Zenith',
    default: 'Zenith - Programming Contest'
  },
  description: 'A 36-hour programming contest featuring CTF, Kaggle, Hackathon, and CP',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#000000',
  icons: {
    icon: '/favicon.ico', 
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={spaceGrotesk.className}>
        {children}
      </body>
    </html>
  );
}
