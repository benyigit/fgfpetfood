import type { Metadata } from 'next';
import PageView from './page-view';
import { getPublicEvents, publicSiteOrigin } from '@/lib/content-public';
export const dynamic = 'force-dynamic';
export function generateMetadata(): Metadata {
  const title = 'Events — FGF Pet Food Bazaar';
  const description = 'Discover dog-friendly community days, event ideas and the latest FGF Pet Food Bazaar gatherings.';
  const url = `${publicSiteOrigin()}/events`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: 'website' } };
}
export default async function EventsPage() {
  return <PageView events={await getPublicEvents()} />;
}
