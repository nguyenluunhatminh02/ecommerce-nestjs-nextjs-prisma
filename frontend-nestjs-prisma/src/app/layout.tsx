import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'ShopVN - Sàn Thương Mại Điện Tử',
    template: '%s | ShopVN',
  },
  description:
    'ShopVN - Sàn thương mại điện tử hàng đầu Việt Nam. Mua sắm trực tuyến hàng triệu sản phẩm với giá tốt nhất.',
  keywords: ['ecommerce', 'shopping', 'online shopping', 'mua sắm', 'thương mại điện tử'],
  authors: [{ name: 'ShopVN' }],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://shopvn.com',
    title: 'ShopVN - Sàn Thương Mại Điện Tử',
    description: 'Mua sắm trực tuyến hàng triệu sản phẩm với giá tốt nhất.',
    siteName: 'ShopVN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShopVN - Sàn Thương Mại Điện Tử',
    description: 'Mua sắm trực tuyến hàng triệu sản phẩm với giá tốt nhất.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
