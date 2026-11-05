import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rateLimit.ts";

import { corsHeadersFor } from "../_shared/http.ts";

const getCorsHeaders = (origin: string | null) =>
  corsHeadersFor(new Request("https://stackd.local/", { headers: origin ? { origin } : {} }));

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting - 5 requests per minute per IP
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitResult = await checkRateLimit(
      supabaseAdmin,
      `instagram:${ip}`,
      'scrape-instagram',
      { windowMinutes: 1, maxRequests: 5 }
    );

    if (!rateLimitResult.allowed) {
      console.log(`Rate limit exceeded for Instagram scrape from IP: ${ip}`);
      return createRateLimitResponse(rateLimitResult.resetAt, corsHeaders);
    }

    const { instagramUrl } = await req.json();

    if (!instagramUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Instagram URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up Instagram URL - remove query params
    let cleanUrl = instagramUrl.trim();
    if (cleanUrl.includes('?')) {
      cleanUrl = cleanUrl.split('?')[0];
    }
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = `https://www.instagram.com/${cleanUrl.replace('@', '')}`;
    }

    console.log('Scraping Instagram URL:', cleanUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: cleanUrl,
        formats: ['markdown', 'html', 'links', 'screenshot'],
        waitFor: 3000, // Wait for dynamic content to load
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract image URLs from the scraped content
    const html = data.data?.html || data.html || '';
    const links = data.data?.links || data.links || [];
    
    // Find Instagram image URLs (cdninstagram.com images)
    const imageRegex = /https:\/\/[^"'\s]+?cdninstagram\.com[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi;
    const htmlImages = html.match(imageRegex) || [];
    
    // Also check for scontent URLs which Instagram uses
    const scontentRegex = /https:\/\/scontent[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi;
    const scontentImages = html.match(scontentRegex) || [];
    
    // Combine and dedupe images
    const allImages = [...new Set([...htmlImages, ...scontentImages])];
    
    // Filter for high-quality images (usually larger dimensions in URL)
    const highQualityImages = allImages.filter(url => {
      // Prefer larger images
      return url.includes('1080') || url.includes('640') || url.includes('750') || !url.includes('150');
    }).slice(0, 12); // Limit to 12 photos

    console.log(`Found ${allImages.length} total images, ${highQualityImages.length} high-quality`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          url: cleanUrl,
          photos: highQualityImages,
          totalFound: allImages.length,
          screenshot: data.data?.screenshot || data.screenshot,
          metadata: data.data?.metadata || data.metadata,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping Instagram:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape Instagram';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
