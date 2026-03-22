import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập | ShopVN',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background">
      <div className="flex-1 flex items-center justify-center p-4">{children}</div>
    </div>
  );
}
