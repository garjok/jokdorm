import { createBrowserClient } from '@supabase/ssr';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    // Return a mock client during build/SSR when env vars aren't available
    return {
      from: () => ({
        select: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        order: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        in: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        limit: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        gte: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        lte: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        ilike: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        not: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      },
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
    } as any;
  }
  
  // Use createBrowserClient from @supabase/ssr so the auth session
  // is persisted in cookies and survives page navigations / refreshes
  return createBrowserClient(supabaseUrl, supabaseKey);
}

export const supabase = getSupabaseClient();

export async function getUserRole(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  if (error) return null;
  return data?.role || 'user';
}
