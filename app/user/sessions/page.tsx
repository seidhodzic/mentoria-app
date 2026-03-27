import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
export default async function UserSessionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <div style={{padding:40,fontFamily:'Saira,sans-serif',background:'#EFEFEF',minHeight:'100vh'}}>
      <h2 style={{fontFamily:'Saira Condensed,sans-serif',textTransform:'uppercase',color:'#19353E',marginBottom:16}}>Mentor Sessions</h2>
      <p style={{color:'rgba(25,53,62,0.6)',marginBottom:24}}>Session booking with Google Meet coming in Phase 6.</p>
      <a href="/user" style={{color:'#F7BC15',fontWeight:700,textDecoration:'none'}}>← Back to Dashboard</a>
    </div>
  );
}
