'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, BarChart3, User, MessageSquare, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/calendar', icon: Calendar, label: 'Calendar' },
    { href: '/stats', icon: BarChart3, label: 'Stats' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  // Alternative nav items for different screens
  const tournamentNavItems = [
    { href: '/', icon: Home, label: 'Tournaments' },
    { href: '/calendar', icon: Calendar, label: 'Calendar' },
    { href: '/stats', icon: BarChart3, label: 'Stats' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  const profileNavItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/search', icon: MessageSquare, label: 'Search' },
    { href: '/saved', icon: Bookmark, label: 'Saved' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  // Determine which nav items to show based on current route
  let items = navItems;
  if (pathname?.startsWith('/profile')) {
    items = profileNavItems;
  } else if (pathname?.startsWith('/tournaments') || pathname === '/') {
    items = tournamentNavItems;
  }

  return (
    <nav className="border fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-[480px] mx-auto">
      <div className="flex justify-around items-center h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-purple-600' : ''}`} />
              <div className={cn("w-8 h-0.5 mt-1", isActive ? 'bg-purple-600' : 'bg-transparent')} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

