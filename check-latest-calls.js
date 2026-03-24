import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLastCalls() {
  const { data, error } = await supabase
    .from('call_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(4);

  if (error) {
    console.error("Error fetching calls:", error);
    return;
  }

  for (const call of data) {
    console.log(`\n=== Call Session: ${call.session_id} | Created: ${call.created_at} ===`);
    if (call.transcript && Array.isArray(call.transcript)) {
      call.transcript.forEach(msg => {
        console.log(`[${msg.role.toUpperCase()}]: ${msg.content}`);
      });
    } else {
      console.log("No transcript array found.");
    }
  }
}

checkLastCalls();
