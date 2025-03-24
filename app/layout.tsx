import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hono | nextjs',
  description: 'Generated by hono',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
