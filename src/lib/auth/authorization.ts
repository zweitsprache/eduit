import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/neon';

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
};

export async function getCurrentAppUser(): Promise<AppUser | null> {
  const { data: session } = await auth.getSession();
  if (!session?.user) return null;

  const rows = await sql`
    select role
    from neon_auth."user"
    where id = ${session.user.id}
  ` as Array<{ role: string | null }>;
  const role = rows[0]?.role ?? 'user';

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role,
    isAdmin: role.split(',').map((value) => value.trim()).includes('admin'),
  };
}
