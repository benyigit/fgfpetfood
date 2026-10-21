'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
type Language = 'en';
const identity = <T,>(value: T): T => value;
const languageTools = { language: 'en' as const, t: identity, setLanguage: (_language: Language) => {} };
// Public releases use English. The bilingual preview is maintained locally.
export function LanguageProvider({children, brand}: {children: React.ReactNode; initialLanguage: Language; brand: 'quipaw' | 'fgfpetfood'}) {
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.lang = 'en';
    if (pathname.startsWith('/shop/') || pathname.startsWith('/blog/')) return;
    const label = brand === 'quipaw' ? 'Quipaw' : 'FGF Pet Food Bazaar';
    const page = pathname === '/account' ? 'My account' : pathname === '/cart' ? 'My treat bag' : pathname === '/shop' ? 'Shop' : pathname === '/blog' ? 'Blog' : pathname === '/events' ? (brand === 'quipaw' ? 'Good times' : 'Events') : 'Good treats. Happy tails. All day.';
    document.title = label + ' — ' + page;
  }, [brand, pathname]);
  return children;
}
export function useLanguage(){ return languageTools; }
