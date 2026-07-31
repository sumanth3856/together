import '../styles/index.css';
import { Inter, Outfit, Literata, Be_Vietnam_Pro } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], display: 'swap', variable: '--font-outfit' });

const literata = Literata({ subsets: ['latin'], display: 'swap', variable: '--font-literata' });
const beVietnamPro = Be_Vietnam_Pro({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-be-vietnam' });

export const metadata = {
  title: 'Together — Watch Together, Feel Together',
  description: 'A premium YouTube co-watching experience. Watch videos in perfect sync with friends, anywhere in the world.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${literata.variable} ${beVietnamPro.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#14130A" />
        <meta name="color-scheme" content="dark" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
