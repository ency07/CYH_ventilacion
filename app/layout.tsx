import { Inter, Bebas_Neue, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import ConditionalFooter from '@/components/layout/ConditionalFooter';
import { ThemeProvider } from '@/components/ThemeProvider';

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
  title: 'CYH Ventilación Industrial | Extractores y HVAC Industrial Colombia',
  description: 'Diseño, fabricación y mantenimiento de sistemas de ventilación industrial en Barranquilla y toda la Costa Caribe. Extractores, HVAC y balanceo dinámico de alta capacidad.',
  keywords: 'ventilacion industrial Barranquilla, extractores industriales Colombia, HVAC industrial Caribe, mantenimiento industrial Barranquilla, balanceo dinamico Colombia, RETIE, NTC 2050',
  authors: [{ name: 'CYH Ingeniería B2B' }],
  robots: 'index, follow',
  openGraph: {
    title: 'CYH Ventilación Industrial | Sistemas de Flujo de Aire Crítico',
    description: 'Soluciones estructurales de ventilación forzada, balanceo dinámico y HVAC industrial en Colombia.',
    url: 'https://cyh-ingenieria.com',
    siteName: 'CYH Ingeniería',
    locale: 'es_CO',
    type: 'website',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${inter.variable} ${bebasNeue.variable} ${jetbrainsMono.variable} font-sans bg-background text-text-primary antialiased min-h-screen flex flex-col justify-between transition-colors duration-300`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* Schema.org IndustrialBusiness JSON-LD microdata */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "IndustrialBusiness",
                "name": "CYH Ventilación Industrial",
                "image": "https://cyh-ingenieria.com/logo.png",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Vía 40 # 73-290, Zona Industrial",
                  "addressLocality": "Barranquilla",
                  "addressRegion": "Atlántico",
                  "postalCode": "080001",
                  "addressCountry": "CO"
                },
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": 10.9639,
                  "longitude": -74.7964
                },
                "url": "https://cyh-ingenieria.com",
                "telephone": "+576053094567",
                "priceRange": "$$$",
                "knowsAbout": [
                  "Ventilación Industrial",
                  "Extractores Industriales",
                  "HVAC Industrial",
                  "Balanceo Dinámico",
                  "Mantenimiento Predictivo"
                ]
              })
            }}
          />
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <ConditionalFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
