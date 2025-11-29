import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dgrzsmcxqhxgqcjecjlh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncnpzbWN4cWh4Z3FjamVjamxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjM3OTQsImV4cCI6MjA3OTk5OTc5NH0.lqNuexMzBBzyEFUuF9g6YiAcoJKCXgK__GmoQmEzaD4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

