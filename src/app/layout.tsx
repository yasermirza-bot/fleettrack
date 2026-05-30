import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OptecAus FleetTrack',
  description: 'Car fleet rental management for rideshare operators',
  manifest: '/manifest.json',
  themeColor: '#0f1e3d',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FleetTrack',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FleetTrack" />
        <meta name="theme-color" content="#0f1e3d" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
