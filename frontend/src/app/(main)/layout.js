import { BottomNav } from '@/components/navigation/BottomNav';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {children}
      <BottomNav />
    </div>
  );
}

