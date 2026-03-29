import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { getDashboardPath, normalizeRole } from '@/lib/role';
import DashboardShell from '@/components/DashboardShell';
const MENTOR_NAV = [
  {label:'Overview',href:'/mentor'},
  {label:'Members',href:'/mentor/members'},
  {label:'Sessions',href:'/mentor/sessions'},
  {label:'Materials',href:'/mentor/materials'},
];
export default async function MentorPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role,full_name,status').eq('id',user.id).single();
  if (normalizeRole(profile?.role) !== 'mentor' && normalizeRole(profile?.role) !== 'admin') {
    redirect(getDashboardPath(normalizeRole(profile?.role)));
  }
  const { count: totalMaterials } = await supabase.from('materials').select('*',{count:'exact',head:true});
  return (
    <DashboardShell title="Mentor Dashboard" eyebrow="Mentor Portal"
      subtitle="Manage your mentees, sessions and learning materials."
      userName={profile?.full_name??user.email??''} userRole="mentor"
      navItems={MENTOR_NAV} activeNav="/mentor"
      stats={[
        {label:'Assigned Members',value:'—',sub:'coming in Phase 2'},
        {label:'Upcoming Sessions',value:'—',sub:'coming in Phase 2'},
        {label:'Published Materials',value:String(totalMaterials??0),sub:'available resources'},
      ]}>
      <div className="alert alert-info" style={{marginBottom:28}}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{flexShrink:0,marginTop:2}}><circle cx="10" cy="10" r="7"/><path d="M10 7v4M10 13v.5"/></svg>
        Member assignment and session booking will be available in the next phase.
      </div>
      <div className="cards-grid">
        <Link href="/mentor/members" className="action-card">
          <div className="icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M2 20c0-3.3 3.1-6 7-6"/><circle cx="17" cy="14" r="3"/><path d="M14 20c0-1.7 1.3-3 3-3s3 1.3 3 3"/></svg></div>
          <h3>Mentee Overview</h3><p>Review member progress, notes and next actions.</p>
        </Link>
        <Link href="/mentor/sessions" className="action-card">
          <div className="icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <h3>Sessions</h3><p>Schedule and manage mentoring sessions with Google Meet.</p>
        </Link>
        <Link href="/mentor/materials" className="action-card">
          <div className="icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7BC15" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <h3>Materials</h3><p>Upload and manage learning resources for your members.</p>
        </Link>
      </div>
    </DashboardShell>
  );
}
