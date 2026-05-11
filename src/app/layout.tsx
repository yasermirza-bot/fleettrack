import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FleetTrack — Rental Management',
  description: 'Car fleet rental management for rideshare operators',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
