import '../styles/index.css';
import { Oswald, Playfair_Display, Chivo } from 'next/font/google';

const oswald = Oswald({ subsets: ['latin'], weight: ['200', '300', '400', '500', '600', '700'], display: 'swap', variable: '--font-oswald' });
const playfairDisplay = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'], style: ['normal', 'italic'], display: 'swap', variable: '--font-playfair-display' });
const chivo = Chivo({ subsets: ['latin'], weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], style: ['normal', 'italic'], display: 'swap', variable: '--font-chivo' });

export const metadata = {
  title: 'Being Us | Watch Together',
  description: 'A premium YouTube co-watching experience. Watch videos in perfect sync with friends, anywhere in the world.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#efede6" />
        <meta name="color-scheme" content="light" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" rel="stylesheet" />
      </head>
      <body className={`antialiased ${oswald.variable} ${playfairDisplay.variable} ${chivo.variable}`}>
        {children}
      </body>
    </html>
  );
}
