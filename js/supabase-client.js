/* jshint esversion: 6 */
'use strict';

// ── Supabase client ───────────────────────────────────────
// Replace both placeholders after creating your Supabase project.
// Dashboard → Settings → API → Project URL + anon public key.
const SUPABASE_URL      = 'https://siypaeaskgenmnqqrwqy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpeXBhZWFza2dlbm1ucXFyd3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTkxNzksImV4cCI6MjA5NjA3NTE3OX0.VouZAjPr7x-TuLa7jKmGwu6xoMCjtzYlE3lkJCJ57yw';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);