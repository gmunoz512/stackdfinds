import { guardPaidApi } from "../_shared/paidApiGuard.ts";
import { aiGatewayConfig } from "../_shared/aiGateway.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const blocked = await guardPaidApi(req, "generate-vendor-description", corsHeaders, true);
  if (blocked) return blocked;

  try {
    const { name, category, pricePerPerson, duration, maxGuests, includedItems } = await req.json();

    const gateway = aiGatewayConfig();

    const prompt = `Write a compelling, professional description for a ${category} vendor called "${name}". 

Details:
- Price: $${pricePerPerson} per person
- Duration: ${duration}
- Maximum guests: ${maxGuests}
- What's included: ${includedItems?.join(', ') || 'Not specified'}

Write 2-3 engaging paragraphs (about 150 words total) that:
1. Captures what makes this experience special
2. Highlights the value and what guests can expect
3. Uses warm, inviting language that appeals to vacation rental guests

Don't include the price or specifics in the description - just paint a picture of the experience.`;

    console.log('Generating description for:', name);

    const response = await fetch(gateway.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gateway.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        max_tokens: 800,
        model: gateway.model,
        messages: [
          { 
            role: "system", 
            content: "You are a professional copywriter specializing in luxury travel and vacation experiences. Write engaging, warm descriptions that make guests excited to book." 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content;

    if (!description) {
      throw new Error('No description generated');
    }

    console.log('Description generated successfully');

    return new Response(
      JSON.stringify({ success: true, description }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating description:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to generate description' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
