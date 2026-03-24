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

        const payload = {
            objective: "conversion",
            theme: "Fluxo de Automação",
            userId: "test-user-123",
            postType: "feed"
        };

        console.log('Testing generate-post via internal call...');
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-post`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        return new Response(JSON.stringify({
            status: response.status,
            ok: response.ok,
            imageUrls: data.variations?.map((v: any) => v.imageUrl),
            firstVariation: data.variations?.[0]?.caption?.substring(0, 50) + "..."
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
