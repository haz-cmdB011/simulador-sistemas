import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://opsdfefftzvhljjueljm.supabase.co/rest/v1/';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc2RmZWZmdHp2aGxqanVlbGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4ODEzOTgsImV4cCI6MjEwNDQ1NzM5OH0.qD9v39_149Gp9TJyCEVnm3FlbRPMutzLz0c3qm8dJpY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
