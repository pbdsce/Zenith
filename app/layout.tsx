import './globals.css';
import type { Metadata } from 'next';
import { Instrument_Serif } from 'next/font/google';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from '@/components/ui/toaster';
import { HelpButton } from '@/components/ui/help-button';
import { Analytics } from '@vercel/analytics/next';
import { PostHogProvider } from '@/components/providers/PostHogProvider';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-heading'
});

export const metadata: Metadata = {
  title: {
    template: '%s | Zenith',
    default: 'Zenith'
  },
  description: 'Zenith is a 24-hour hackathon that brings together innovators, developers, designers, and problem-solvers to collaborate intensively on real-world challenges. Participants work continuously over a 24-hour period to ideate, build, and present innovative technical solutions, fostering creativity, teamwork, and rapid problem-solving in a high-energy environment.',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#171717',
  icons: {
    icon: '/Vector.svg',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ background: '#171717' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className={instrumentSerif.variable} style={{ fontFamily: 'var(--font-body)', background: '#171717' }}>
        <PostHogProvider>
          <AuthProvider>
            {children}
            <Toaster />
            <HelpButton />
          </AuthProvider>
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
