import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RateLimitConfig {
  windowMinutes: number;
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const windowStart = new Date(
    Date.now() - config.windowMinutes * 60 * 1000
  );

  // Query for existing rate limit entry within the current window
  const { data: existing, error: queryError } = await supabase
    .from('rate_limits')
    .select('id, request_count, window_start')
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .order('window_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (queryError) {
    console.error('Rate limit query error:', queryError);
    // On error, allow the request but log it
    return { 
      allowed: true, 
      remaining: config.maxRequests - 1, 
      resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000) 
    };
  }

  if (existing) {
    // Check if limit exceeded
    if (existing.request_count >= config.maxRequests) {
      const resetAt = new Date(
        new Date(existing.window_start).getTime() + config.windowMinutes * 60 * 1000
      );
      return { 
        allowed: false, 
        remaining: 0, 
        resetAt 
      };
    }

    // Increment counter
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);

    if (updateError) {
      console.error('Rate limit update error:', updateError);
    }

    return { 
      allowed: true, 
      remaining: config.maxRequests - existing.request_count - 1,
      resetAt: new Date(
        new Date(existing.window_start).getTime() + config.windowMinutes * 60 * 1000
      )
    };
  }

  // No existing entry, create new one
  const { error: insertError } = await supabase
    .from('rate_limits')
    .insert({
      identifier,
      endpoint,
      request_count: 1,
      window_start: new Date().toISOString()
    });

  if (insertError) {
    console.error('Rate limit insert error:', insertError);
  }

  return { 
    allowed: true, 
    remaining: config.maxRequests - 1,
    resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000)
  };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
    ...(result.allowed ? {} : { 'Retry-After': String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)) })
  };
}

export function createRateLimitResponse(
  resetAt: Date, 
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Too many requests. Please wait a moment before trying again.',
      resetAt: resetAt.toISOString()
    }),
    { 
      status: 429, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((resetAt.getTime() - Date.now()) / 1000))
      } 
    }
  );
}
