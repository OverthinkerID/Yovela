import './globals.css';
import React from 'react';
import { Poppins } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  title: 'Yovela Dental Clinic — Klinik Gigi Modern & SIM-RME',
  description: 'Klinik Gigi Modern & Sistem Informasi Manajemen Rekam Medis Elektronik, Odontogram FDI, Jadwal & Kasir',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={poppins.variable} suppressHydrationWarning>
      <body className="bg-[#F5F1E8] text-[#1B4332] font-sans antialiased m-0 p-0 transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
