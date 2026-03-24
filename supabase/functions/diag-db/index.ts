import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { count: postsCount } = await supabase.from('generated_posts').select('*', { count: 'exact', head: true });
        const { count: usersCount } = await supabase.from('company_profiles').select('*', { count: 'exact', head: true });

        return new Response(JSON.stringify({
            postsCount,
            usersCount,
            projectId: Deno.env.get('SUPABASE_PROJECT_ID')
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});
