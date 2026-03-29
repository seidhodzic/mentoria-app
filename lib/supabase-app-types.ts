/** App-facing unions (Postgres uses text + CHECK). Kept out of generated `types/supabase.ts` so `npm run gen:types` does not wipe them. */
export type UserRoleEnum = 'user' | 'mentor' | 'admin';
export type UserStatusEnum = 'pending' | 'active' | 'suspended';
export type SessionTypeEnum = '1on1' | 'group';
