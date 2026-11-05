import { guardPaidApi, normalizeAirbnbUrl } from "../_shared/paidApiGuard.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AirbnbReview {
  reviewerName: string;
  reviewerAvatar?: string;
  rating?: number;
  date: string;
  comment: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const blocked = await guardPaidApi(req, "scrape-airbnb-reviews", corsHeaders, true);
  if (blocked) return blocked;

  try {
    const { airbnbUrl } = await req.json();

    if (!airbnbUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Airbnb URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedUrl = normalizeAirbnbUrl(airbnbUrl);
    if (!formattedUrl) {
      return new Response(JSON.stringify({ success: false, error: 'Use an https://www.airbnb.com/experiences/ or /rooms/ listing URL.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured. Please set up Firecrawl in Settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping Airbnb URL:', formattedUrl);

    // Use Firecrawl to scrape the Airbnb page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content to load
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Firecrawl API error:', data);
      const errorMessage = data.error?.includes('not currently supported') 
        ? 'Airbnb scraping is not available with the current Firecrawl plan. Please add reviews manually.'
        : data.error || 'Failed to scrape Airbnb page';
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: response.ok ? 400 : response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scrape successful, parsing reviews...');

    // Extract reviews from the scraped content
    const markdown = data.data?.markdown || data.markdown || '';
    const reviews = parseAirbnbReviews(markdown);

    // Try to extract the overall rating
    const ratingMatch = markdown.match(/(\d+\.?\d*)\s*★|★\s*(\d+\.?\d*)|(\d+\.?\d*)\s*out of 5|rating[:\s]+(\d+\.?\d*)/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1] || ratingMatch[2] || ratingMatch[3] || ratingMatch[4]) : null;

    console.log(`Found ${reviews.length} reviews, rating: ${rating}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          reviews: reviews.slice(0, 5), // Return up to 5 reviews
          rating,
          url: formattedUrl,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping Airbnb:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape Airbnb reviews';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseAirbnbReviews(markdown: string): AirbnbReview[] {
  const reviews: AirbnbReview[] = [];
  
  // Airbnb review patterns - look for common review structures
  // Pattern 1: Look for names followed by dates and review text
  const reviewPatterns = [
    // Pattern: "Name\nDate\nReview text"
    /([A-Z][a-z]+(?:\s+[A-Z]\.)?)\n([A-Za-z]+\s+\d{4})\n([^]*?)(?=\n[A-Z][a-z]+(?:\s+[A-Z]\.)?|\n---|\n\*\*\*|$)/g,
    // Pattern: Reviews with "★" ratings
    /([A-Z][a-z]+(?:\s+[A-Z]\.)?)[^\n]*\n([A-Za-z]+\s+\d{4})[^\n]*\n((?:(?!(?:[A-Z][a-z]+(?:\s+[A-Z]\.)?[^\n]*\n[A-Za-z]+\s+\d{4})).)+)/g,
  ];

  for (const pattern of reviewPatterns) {
    let match;
    while ((match = pattern.exec(markdown)) !== null) {
      const [, name, date, comment] = match;
      
      if (name && date && comment) {
        const cleanComment = comment.trim()
          .replace(/\n+/g, ' ')
          .replace(/\s+/g, ' ')
          .slice(0, 500); // Limit comment length
        
        if (cleanComment.length > 20) { // Only include meaningful reviews
          reviews.push({
            reviewerName: name.trim(),
            date: date.trim(),
            comment: cleanComment,
          });
        }
      }
      
      if (reviews.length >= 10) break;
    }
    
    if (reviews.length >= 5) break;
  }

  // If regex didn't find structured reviews, try a simpler approach
  if (reviews.length === 0) {
    // Look for quoted text that might be reviews
    const quotedReviews = markdown.match(/"([^"]{50,500})"/g);
    if (quotedReviews) {
      quotedReviews.slice(0, 5).forEach((quote, index) => {
        reviews.push({
          reviewerName: `Guest ${index + 1}`,
          date: 'Recent',
          comment: quote.replace(/"/g, '').trim(),
        });
      });
    }
  }

  return reviews;
}
