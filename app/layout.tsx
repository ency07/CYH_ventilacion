import { Inter, Bebas_Neue, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-bebas-neue',
  weight: ['400'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: 'CYH VENTILACIÓN INDUSTRIAL | Ingeniería de Flujo de Aire',
  description: 'Sistemas de ventilación de alto rendimiento para entornos industriales críticos. Ingeniería, fabricación, mantenimiento y diagnóstico en LATAM.',
  keywords: 'ventilacion industrial, extractores industriales, ingenieria de flujo, mineria, data centers, CYH OS',
  authors: [{ name: 'CYH Ingeniería' }],
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark scroll-smooth">
      <body
        className={`${inter.variable} ${bebasNeue.variable} ${jetbrainsMono.variable} font-sans bg-background text-text-primary antialiased min-h-screen flex flex-col justify-between`}
      >
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
