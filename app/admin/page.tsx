import { currentMember, communityAvailable } from '@/lib/community';
import { AdminAccess } from '@/components/admin-access';
import { AdminDashboard } from '@/components/admin-dashboard';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Brand studio | FGF Pet Food Bazaar', robots: { index: false, follow: false } };
export default async function AdminPage() {
  let member = null;
  try { if (!communityAvailable()) return <AdminAccess brand="fgfpetfood" unavailable />; member = await currentMember(); }
  catch { return <AdminAccess brand="fgfpetfood" unavailable />; }
  if (!member) return <AdminAccess brand="fgfpetfood" />;
  if (member.role !== 'admin') return <AdminAccess brand="fgfpetfood" denied name={member.name} />;
  return <AdminDashboard brand="fgfpetfood" member={{name:member.name,email:member.email}} />;
}
