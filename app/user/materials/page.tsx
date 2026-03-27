import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
export default async function UserMaterialsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: materials } = await supabase.from('materials').select('id, title, description').order('created_at', { ascending: false });
  return (
    <div style={{padding:40,fontFamily:'Saira,sans-serif',background:'#EFEFEF',minHeight:'100vh'}}>
      <h2 style={{fontFamily:'Saira Condensed,sans-serif',textTransform:'uppercase',color:'#19353E',marginBottom:16}}>Materials</h2>
      {materials && materials.length > 0 ? (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {materials.map((m) => (
            <div key={m.id} style={{background:'#fff',padding:'16px 20px',borderRadius:3,border:'1px solid rgba(25,53,62,0.07)'}}>
              <div style={{fontWeight:700,color:'#19353E'}}>{m.title}</div>
              {m.description && <div style={{fontSize:'0.85rem',color:'rgba(25,53,62,0.6)',marginTop:4}}>{m.description}</div>}
            </div>
          ))}
        </div>
      ) : (
        <p style={{color:'rgba(25,53,62,0.5)'}}>No materials available yet.</p>
      )}
      <br/>
      <a href="/user" style={{color:'#F7BC15',fontWeight:700,textDecoration:'none'}}>← Back to Dashboard</a>
    </div>
  );
}
