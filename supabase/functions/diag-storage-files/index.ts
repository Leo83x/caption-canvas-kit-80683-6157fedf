import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // List all files in the bucket
        const { data: files, error } = await supabase.storage.from('generated-images').list('', {
            limit: 10,
            sortBy: { column: 'created_at', order: 'desc' }
        });

        if (error) throw error;

        // Check sizes of folders/files
        const details = await Promise.all((files || []).map(async (f) => {
            if (f.id === null) { // It's a folder
                const { data: subFiles } = await supabase.storage.from('generated-images').list(f.name);
                return { name: f.name, isFolder: true, childrenCount: subFiles?.length };
            }
            return { name: f.name, size: f.metadata?.size, created: f.created_at };
        }));

        return new Response(JSON.stringify({
            files: details
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
