import { guardPaidApi } from "../_shared/paidApiGuard.ts";
import { aiGatewayConfig } from "../_shared/aiGateway.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceComparisonRequest {
  category: string;
  experienceName: string;
  currentPrice: number;
  duration?: string;
  location?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const blocked = await guardPaidApi(req, "price-comparison", corsHeaders, false);
  if (blocked) return blocked;

  try {
    const { category, experienceName, currentPrice, duration, location = 'Tulum' }: PriceComparisonRequest = await req.json();

    console.log('Price comparison request:', { category, experienceName, currentPrice, duration, location });

    if (!category || !experienceName || currentPrice === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: category, experienceName, currentPrice' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let gateway;
    try {
      gateway = aiGatewayConfig();
    } catch (configError) {
      console.error(configError);
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a local travel expert specializing in ${location}, Mexico tourism and experiences. 
You provide accurate market price comparisons for tourist experiences and services.
Always be helpful and provide realistic price ranges based on current market conditions.
Focus on giving practical, actionable information that helps travelers make informed decisions.`;

    const userPrompt = `I'm looking at a "${category}" experience called "${experienceName}" in ${location}, Mexico that costs $${currentPrice} per person${duration ? ` for ${duration}` : ''}.

Please provide a market price comparison with the following information:
1. The typical price range for similar ${category} experiences in ${location}
2. Whether this price is below average, average, or above average for the area
3. 2-3 comparable experiences/services in ${location} with their typical price ranges
4. Any factors that might justify price differences (quality, inclusions, exclusivity)

Format your response as JSON with this structure:
{
  "priceRange": { "low": number, "high": number },
  "priceAssessment": "below_average" | "average" | "above_average" | "premium",
  "assessmentText": "brief explanation of the price positioning",
  "comparables": [
    { "name": "comparable experience name", "priceRange": "price range string", "notes": "brief note" }
  ],
  "marketInsight": "1-2 sentence insight about the ${category} market in ${location}"
}`;

    const response = await fetch(gateway.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gateway.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_tokens: 800,
        model: gateway.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service quota exceeded.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate price comparison' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'Empty response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI response content:', content);

    // Try to parse the JSON from the response
    let priceData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      priceData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return a fallback response
      priceData = {
        priceRange: { low: Math.round(currentPrice * 0.7), high: Math.round(currentPrice * 1.3) },
        priceAssessment: 'average',
        assessmentText: 'Based on typical market rates for similar experiences.',
        comparables: [],
        marketInsight: `${category} experiences in ${location} vary based on quality and inclusions.`
      };
    }

    return new Response(
      JSON.stringify({ success: true, data: priceData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Price comparison error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
