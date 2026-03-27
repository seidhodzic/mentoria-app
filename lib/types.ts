export type UserRole = 'user' | 'mentor' | 'admin';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
};
