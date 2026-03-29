import AIAssistant from '@/components/AIAssistant';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getDashboardPath, normalizeRole } from '@/lib/role';
import { throwIfSupabaseError } from '@/lib/server/supabase-query';

export default async function AdminSubscriptionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  throwIfSupabaseError(profileError, 'profile', { ignoreCodes: ['PGRST116'] });

  if (normalizeRole(profile?.role) !== 'admin') {
    redirect(getDashboardPath(normalizeRole(profile?.role)));
  }
  return (
    <div style={{padding:40,fontFamily:'Saira,sans-serif',background:'#EFEFEF',minHeight:'100vh'}}>
      <h2 style={{fontFamily:'Saira Condensed,sans-serif',textTransform:'uppercase',color:'#19353E',marginBottom:16}}>Subscriptions</h2>
      <p style={{color:'rgba(25,53,62,0.6)',marginBottom:24}}>Stripe billing coming in Phase 5.</p>
      <a href="/admin" style={{color:'#F7BC15',fontWeight:700,textDecoration:'none'}}>← Back to Admin</a>
      <AIAssistant />
    </div>
  );
}
