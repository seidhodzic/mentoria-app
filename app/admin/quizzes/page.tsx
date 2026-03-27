import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
export default async function AdminQuizzesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');
  return (
    <div style={{padding:40,fontFamily:'Saira,sans-serif',background:'#EFEFEF',minHeight:'100vh'}}>
      <h2 style={{fontFamily:'Saira Condensed,sans-serif',textTransform:'uppercase',color:'#19353E',marginBottom:16}}>Quizzes</h2>
      <p style={{color:'rgba(25,53,62,0.6)',marginBottom:24}}>Quiz builder coming in Phase 4.</p>
      <a href="/admin" style={{color:'#F7BC15',fontWeight:700,textDecoration:'none'}}>← Back to Admin</a>
    </div>
  );
}
