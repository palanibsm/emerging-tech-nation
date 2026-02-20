import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET — return current visit count
export async function GET() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ count: 0 });
  }
  const supabase = createServerClient();
  const { data } = await supabase
    .from('site_stats')
    .select('value')
    .eq('key', 'total_visits')
    .single();
  return NextResponse.json({ count: data?.value ?? 0 });
}

// POST — increment and return new count
export async function POST() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ count: 0 });
  }
  const supabase = createServerClient();
  const { data } = await supabase.rpc('increment_visits');
  return NextResponse.json({ count: data ?? 0 });
}
