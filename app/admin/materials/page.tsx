import AdminMaterialsClient from '@/features/materials/components/AdminMaterialsClient';
import { normalizeRole } from '@/lib/role';
import { requireUser } from '@/lib/server/auth';
import { throwIfSupabaseError } from '@/lib/server/supabase-query';
import { redirect } from 'next/navigation';

export default async function AdminMaterialsPage() {
  const { supabase, user } = await requireUser();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  throwIfSupabaseError(profileError, 'profile', { ignoreCodes: ['PGRST116'] });

  if (normalizeRole(profile?.role) !== 'admin') redirect('/dashboard');

  const { data: materials, error: materialsError } = await supabase
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false });

  throwIfSupabaseError(materialsError, 'materials');

  return <AdminMaterialsClient materials={materials ?? []} userId={user.id} />;
}
