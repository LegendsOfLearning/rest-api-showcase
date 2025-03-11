import '../styles/globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppLayout } from '@/components/AppLayout'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <title>Legends of Learning REST API Demo</title>
        <meta name="description" content="A demo application for the Legends of Learning REST API" />
      </head>
      <body className="min-h-screen bg-slate-50 flex flex-col">
        <AuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
} 