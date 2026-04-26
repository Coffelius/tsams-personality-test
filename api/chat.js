/**
 * Cloudflare Pages Function: /api/chat
 * AI chat assistant "Luna" using Workers AI (Llama 3.1 8B)
 *
 * Uses built-in AI binding - no API tokens needed
 */

// Character profiles for context
const CHARACTER_PROFILES = {
  sun: { name: "Sun", emoji: "☀️", title: "The Radiant Optimist" },
  moon: { name: "Moon", emoji: "🌙", title: "The Intuitive Observer" },
  lunar: { name: "Lunar", emoji: "🌖", title: "The Gentle Heart" },
  eclipse: { name: "Eclipse", emoji: "🌑", title: "The Mystical Strategist" },
  solarFlare: { name: "Solar Flare", emoji: "🔥", title: "The Fierce Protector" },
  foxy: { name: "Foxy", emoji: "🦊", title: "The Clever Charmer" },
  earth: { name: "Earth", emoji: "🌍", title: "The Steadfast Guardian" },
  puppet: { name: "Puppet", emoji: "🎭", title: "The Complex Enigma" },
  monty: { name: "Monty", emoji: "🐊", title: "The Loyal Brother" },
  bloodmoon: { name: "Bloodmoon", emoji: "🩸", title: "The Intense Defender" },
  djMusicMan: { name: "DJ Music Man", emoji: "🎵", title: "The Creative Spirit" },
  jackOMoon: { name: "Jack O' Moon", emoji: "🎃", title: "The Playful Trickster" },
  oldMoon: { name: "Old Moon", emoji: "🌗", title: "The Wise Elder" },
  ruIN: { name: "RuIN", emoji: "⚡", title: "The Hidden Potential" },
  positiveMoon: { name: "Positive Moon", emoji: "✨", title: "The Beacon of Hope" },
  negativeMoon: { name: "Negative Moon", emoji: "💫", title: "The Critical Thinker" }
};

// Luna's personality system prompt
const LUNA_SYSTEM_PROMPT = `You are Luna, a fun and slightly cheeky psychological assistant helping users understand their SAMS personality test results.

Your personality traits:
- Warm and encouraging with a playful sense of humor
- Gently teasing but never mean-spirited
- Uses casual language with occasional fun expressions
- Offers genuine psychological insights in an approachable way
- Celebrates self-discovery and personal growth

Your role:
- Help users understand their personality results
- Explain the SAMS character archetypes
- Offer gentle guidance on self-improvement
- Keep conversations lighthearted but meaningful

Remember: Personality tests are tools for self-reflection, not rigid boxes. Encourage users to explore all facets of themselves!`;

/**
 * Get character-specific system prompt
 */
function getCharacterSystemPrompt(character) {
  const profile = CHARACTER_PROFILES[character];
  if (!profile) {
    return LUNA_SYSTEM_PROMPT;
  }

  return `${LUNA_SYSTEM_PROMPT}

The user just got ${profile.name} (${profile.title}) as their result!
${profile.emoji} ${profile.name}: ${profile.title}`;
}

/**
 * Generate chat response using Workers AI runtime
 */
async function generateChatResponse(message, history, character, env) {
  const systemPrompt = getCharacterSystemPrompt(character);

  // Build messages array with system prompt + sliding window of recent history
  const messages = [
    { role: 'system', content: systemPrompt },
    // Last 10 messages for context (sliding window)
    ...history.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: message }
  ];

  try {
    // Check if AI binding is available
    if (!env.AI) {
      return getFallbackResponse(message, character);
    }

    // Use Workers AI runtime directly
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      max_tokens: 500,
      temperature: 0.9
    });

    return response?.response || getFallbackResponse(message, character);
  } catch (error) {
    console.error('Chat AI error:', error);
    return getFallbackResponse(message, character);
  }
}

/**
 * Fallback responses when AI is unavailable
 */
function getFallbackResponse(message, character) {
  const profile = CHARACTER_PROFILES[character];
  const characterName = profile?.name || "your SAMS character";
  const emoji = profile?.emoji || "🌟";

  const fallbacks = [
    `Hey there! ${emoji} You got ${characterName} - that's awesome! What would you like to know about your personality type?`,
    `Ooh, interesting question! As a ${characterName}, you've got some unique qualities. Want to dive deeper into what makes you tick?`,
    `Love that you're curious! Your ${characterName} result is pretty cool. What aspect interests you most?`
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * Main export for Cloudflare Pages Functions
 */
export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);

    // GET request handler
    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({
          service: 'Luna Chat API',
          version: '1.0.0',
          aiAvailable: !!env.AI,
          characters: Object.keys(CHARACTER_PROFILES)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST request for chat
    if (request.method === 'POST') {
      const body = await request.json();
      const { message, history = [], character } = body;

      // Validation
      if (!message || typeof message !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Invalid message' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!Array.isArray(history)) {
        return new Response(
          JSON.stringify({ error: 'Invalid history array' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Generate response
      const response = await generateChatResponse(message, history, character, env);

      return new Response(
        JSON.stringify({
          response,
          character: character || null,
          aiPowered: !!env.AI
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
