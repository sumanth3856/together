import '../styles/index.css';

export const metadata = {
  title: 'Together - Co-Watching Hub',
  description: 'A minimalist YouTube co-watching web application.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
