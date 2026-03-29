#!/bin/bash
BASE="/Users/seid/Desktop/mentoria-mvp"
echo "Creating stub pages..."

# ── next.config.ts ──
cat > "$BASE/next.config.ts" << 'EOF'
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {};
export default nextConfig;
EOF

# ── Admin stubs ──
mkdir -p "$BASE/app/admin/users" "$BASE/app/admin/materials" "$BASE/app/admin/quizzes" "$BASE/app/admin/subscriptions"

cat > "$BASE/app/admin/users/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');
  return (
    <div style={{padding:40,fontFamily:'Saira,sans-serif',background:'#EFEFEF',minHeight:'100vh'}}>
      <h2 style={{fontFamily:'Saira Condensed,sans-serif',textTransform:'uppercase',color:'#19353E',marginBottom:16}}>User Management</h2>
      <p style={{color:'rgba(25,53,62,0.6)',marginBottom:24}}>Full user management coming in Phase 2.</p>
      <a href="/admin" style={{color:'#F7BC15',fontWeight:700,textDecoration:'none'}}>← Back to Admin</a>
    </div>
  );
}
EOF

cat > "$BASE/app/admin/materials/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
export default async function AdminMaterialsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');
  return (
    <div style={{padding:40,fontFamily:'Saira,sans-serif',background:'#EFEFEF',minHeight:'100vh'}}>
      <h2 style={{fontFamily:'Saira Condensed,sans-serif',textTransform:'uppercase',color:'#19353E',marginBottom:16}}>Materials</h2>
      <p style={{color:'rgba(25,53,62,0.6)',marginBottom:24}}>Content management coming in Phase 3.</p>
      <a href="/admin" style={{color:'#F7BC15',fontWeight:700,textDecoration:'none'}}>← Back to Admin</a>
    </div>
  );
}
EOF

cat > "$BASE/app/admin/quizzes/page.tsx" << 'EOF'
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
EOF

cat > "$BASE/app/admin/subscriptions/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/role';
export default async function AdminSubscriptionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');
  return (
    <div style={{padding:40,fontFamily:'Saira,sans-serif',background:'#EFEFEF',minHeight:'100vh'}}>
      <h2 style={{fontFamily:'Saira Condensed,sans-serif',textTransform:'uppercase',color:'#19353E',marginBottom:16}}>Subscriptions</h2>
      <p style={{color:'rgba(25,53,62,0.6)',marginBottom:24}}>Stripe billing coming in Phase 5.</p>
      <a href="/admin" style={{color:'#F7BC15',fontWeight:700,textDecoration:'none'}}>← Back to Admin</a>
    </div>
  );
}
EOF

# ── Mentor stubs ──
mkdir -p "$BASE/app/mentor/members" "$BASE/app/mentor/sessions" "$BASE/app/mentor/materials"

cat > "$BASE/app/mentor/members/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
export default async function MentorMembersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <div style={{padding:40,fontFamily:'Saira,sans-serif',background:'#EFEFEF',minHeight:'100vh'}}>
      <h2 style={{fontFamily:'Saira Condensed,sans-serif',textTransform:'uppercase',color:'#19353E',marginBottom:16}}>Members</h2>
      <p style={{color:'rgba(25,53,62,0.6)',marginBottom:24}}>Member assignment coming in Phase 2.</p>
      <a href="/mentor" style={{color:'#F7BC15',fontWeight:700,textDecoration:'none'}}>← Back to Mentor</a>
    </div>
  );
}
EOF

cat > "$BASE/app/mentor/sessions/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
export default async function MentorSessionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <div style={{padding:40,fontFamily:'Saira,sans-serif',background:'#EFEFEF',minHeight:'100vh'}}>
      <h2 style={{fontFamily:'Saira Condensed,sans-serif',textTransform:'uppercase',color:'#19353E',marginBottom:16}}>Sessions</h2>
      <p style={{color:'rgba(25,53,62,0.6)',marginBottom:24}}>Session booking with Google Meet coming in Phase 6.</p>
      <a href="/mentor" style={{color:'#F7BC15',fontWeight:700,textDecoration:'none'}}>← Back to Mentor</a>
    </div>
  );
}
EOF

cat > "$BASE/app/mentor/materials/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
export default async function MentorMaterialsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <div style={{padding:40,fontFamily:'Saira,sans-serif',background:'#EFEFEF',minHeight:'100vh'}}>
      <h2 style={{fontFamily:'Saira Condensed,sans-serif',textTransform:'uppercase',color:'#19353E',marginBottom:16}}>Materials</h2>
      <p style={{color:'rgba(25,53,62,0.6)',marginBottom:24}}>Material uploads coming in Phase 3.</p>
      <a href="/mentor" style={{color:'#F7BC15',fontWeight:700,textDecoration:'none'}}>← Back to Mentor</a>
    </div>
  );
}
EOF

# ── User stubs ──
mkdir -p "$BASE/app/user/courses" "$BASE/app/user/quizzes" "$BASE/app/user/materials" "$BASE/app/user/sessions"

cat > "$BASE/app/user/courses/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
export default async function UserCoursesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <div style={{padding:40,fontFamily:'Saira,sans-serif',background:'#EFEFEF',minHeight:'100vh'}}>
      <h2 style={{fontFamily:'Saira Condensed,sans-serif',textTransform:'uppercase',color:'#19353E',marginBottom:16}}>Courses</h2>
      <p style={{color:'rgba(25,53,62,0.6)',marginBottom:24}}>Course library coming in Phase 3.</p>
      <a href="/user" style={{color:'#F7BC15',fontWeight:700,textDecoration:'none'}}>← Back to Dashboard</a>
    </div>
  );
}
EOF

cat > "$BASE/app/user/quizzes/page.tsx" << 'EOF'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
export default async function UserQuizzesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <div style={{padding:40,fontFamily:'Saira,sans-serif',background:'#EFEFEF',minHeight:'100vh'}}>
      <h2 style={{fontFamily:'Saira Condensed,sans-serif',textTransform:'uppercase',color:'#19353E',marginBottom:16}}>Quizzes</h2>
      <p style={{color:'rgba(25,53,62,0.6)',marginBottom:24}}>Quiz system coming in Phase 4.</p>
      <a href="/user" style={{color:'#F7BC15',fontWeight:700,textDecoration:'none'}}>← Back to Dashboard</a>
    </div>
  );
}
EOF

cat > "$BASE/app/user/materials/page.tsx" << 'EOF'
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
EOF

cat > "$BASE/app/user/sessions/page.tsx" << 'EOF'
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
EOF

echo ""
echo "================================================"
echo "  All stub pages created successfully!"
echo "================================================"
echo ""
echo "Now run:"
echo "  npm run build && npm run dev"
