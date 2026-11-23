import type { Metadata } from 'next';

// The admin panel is gated by its password, but there is no reason for search
// engines to index or link to it.
export const metadata: Metadata = {
  title: 'Yönetim Paneli',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
