import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ValidateRequest {
  code: string;
  orderAmount: number;
}

interface ValidationResult {
  valid: boolean;
  discount_type: string | null;
  discount_value: number | null;
  discount_amount: number | null;
  message: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, orderAmount } = await req.json() as ValidateRequest;

    console.log(`[validate-promo-code] Validating code: ${code} for amount: ${orderAmount}`);

    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Promo code is required',
          discount_type: null,
          discount_value: null,
          discount_amount: null,
        } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof orderAmount !== 'number' || orderAmount < 0) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Valid order amount is required',
          discount_type: null,
          discount_value: null,
          discount_amount: null,
        } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to access promo_codes table (RLS blocks direct access)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Call the existing database function for validation
    const { data, error } = await supabaseAdmin.rpc('validate_promo_code', {
      p_code: code.trim(),
      p_order_amount: orderAmount
    });

    if (error) {
      console.error('[validate-promo-code] RPC error:', error);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Failed to validate promo code',
          discount_type: null,
          discount_value: null,
          discount_amount: null,
        } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Invalid promo code',
          discount_type: null,
          discount_value: null,
          discount_amount: null,
        } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = data[0];
    console.log(`[validate-promo-code] Result:`, result);

    return new Response(
      JSON.stringify({
        valid: result.valid,
        discount_type: result.discount_type,
        discount_value: result.discount_value,
        discount_amount: result.discount_amount,
        message: result.message,
      } as ValidationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[validate-promo-code] Error:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        message: 'An error occurred',
        discount_type: null,
        discount_value: null,
        discount_amount: null,
      } as ValidationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
