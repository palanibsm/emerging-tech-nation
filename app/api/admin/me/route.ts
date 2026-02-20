import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/me
 * Returns whether the requesting user is the site admin.
 * Requires: Authorization: Bearer <supabase_access_token>
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.slice(7));

  if (error || !user) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const isAdmin = user.email === process.env.OWNER_EMAIL;
  return NextResponse.json({ isAdmin });
}
