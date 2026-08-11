import './globals.css';

export const metadata = {
  title: 'AuraCRM | College Admission & Enrollment CRM',
  description: 'Enterprise-grade College Admission and Marketing CRM for institutions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
