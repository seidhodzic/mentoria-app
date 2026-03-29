export type UserRole   = 'user' | 'mentor' | 'admin';
export type UserStatus = 'pending' | 'active' | 'suspended';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
};

export type Material = {
  id: string;
  title: string;
  description: string | null;
  visibility: 'public' | 'mentors' | 'users' | 'admins';
  owner_id: string | null;
  created_at: string;
};

export type Quiz = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string | null;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'inactive';
  current_period_end: string | null;
  created_at: string;
};
