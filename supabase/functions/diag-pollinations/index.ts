import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const keywords = "automation,technology,business";
        const testUrl = `https://loremflickr.com/1080/1080/${keywords}`;

        console.log('Testing Pollinations URL:', testUrl);
        const response = await fetch(testUrl);

        return new Response(JSON.stringify({
            url: testUrl,
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get('content-type')
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
