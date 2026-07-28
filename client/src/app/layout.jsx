import '../styles/index.css';

export const metadata = {
  title: 'Together — Watch Together, Feel Together',
  description: 'A premium YouTube co-watching experience. Watch videos in perfect sync with friends, anywhere in the world.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#06080f" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
