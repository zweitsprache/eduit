import { neon } from '@neondatabase/serverless';
import { getCurrentDazitUser } from '@/lib/auth/authorization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TERMS_VERSION = '2025-03-01';

export async function POST(request: Request) {
  const currentUser = await getCurrentDazitUser();
  if (!currentUser) {
    return Response.json({ error: 'authentication_required' }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: 'database_unavailable' }, { status: 503 });
  }

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload || payload.termsAccepted !== true || typeof payload.newsletter !== 'boolean') {
    return Response.json({ error: 'invalid_preferences' }, { status: 400 });
  }
  const firstName = typeof payload.firstName === 'string' ? payload.firstName.trim().slice(0, 100) : null;
  const lastName = typeof payload.lastName === 'string' ? payload.lastName.trim().slice(0, 100) : null;

  const sql = neon(process.env.DATABASE_URL);
  await sql`
    insert into app.user_registration_profile (
      user_id,
      first_name,
      last_name,
      terms_version,
      terms_accepted_at,
      newsletter_opt_in,
      newsletter_updated_at
    ) values (
      ${currentUser.id},
      ${firstName || null},
      ${lastName || null},
      ${TERMS_VERSION},
      now(),
      ${payload.newsletter},
      now()
    )
    on conflict (user_id) do update set
      first_name = coalesce(excluded.first_name, app.user_registration_profile.first_name),
      last_name = coalesce(excluded.last_name, app.user_registration_profile.last_name),
      terms_version = excluded.terms_version,
      terms_accepted_at = excluded.terms_accepted_at,
      newsletter_opt_in = excluded.newsletter_opt_in,
      newsletter_updated_at = excluded.newsletter_updated_at,
      updated_at = now()
  `;

  return Response.json({ ok: true });
}