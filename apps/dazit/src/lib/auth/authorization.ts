import { neon } from '@neondatabase/serverless';
import { auth, isNeonAuthConfigured } from '@/lib/auth/server';

export type DazitUser = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

export async function getCurrentDazitUser(): Promise<DazitUser | null> {
  if (!isNeonAuthConfigured || !process.env.DATABASE_URL) return null;
  const { data: session } = await auth.getSession();
  if (!session?.user) return null;

  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    select role
    from neon_auth."user"
    where id = ${session.user.id}
  ` as Array<{ role: string | null }>;
  const roles = (rows[0]?.role ?? 'user').split(',').map((role) => role.trim());

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    isAdmin: roles.includes('admin'),
  };
}
