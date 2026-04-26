/**
 * Cloudflare Pages Function: /api/explain
 * Generates AI-powered personality explanations using Workers AI (Llama 3.1 8B)
 *
 * Uses built-in AI binding - no API tokens needed
 */

// Character descriptions with detailed psychological profiles
const CHARACTER_PROFILES = {
  sun: {
    name: "Sun",
    emoji: "☀️",
    title: "The Radiant Optimist",
    description: "You embody boundless positivity and energy. Like the sun itself, you light up every room you enter and have an infectious enthusiasm that draws people to you naturally."
  },
  moon: {
    name: "Moon",
    emoji: "🌙",
    title: "The Intuitive Observer",
    description: "You possess deep wisdom and quiet strength. Your thoughtful nature allows you to see beneath the surface, understanding the unspoken emotions and hidden truths that others miss."
  },
  lunar: {
    name: "Lunar",
    emoji: "🌖",
    title: "The Gentle Heart",
    description: "You are the emotional anchor of your community. Your empathy knows no bounds, and you have an extraordinary ability to make everyone feel seen, heard, and valued."
  },
  eclipse: {
    name: "Eclipse",
    emoji: "🌑",
    title: "The Mystical Strategist",
    description: "You dance between light and shadow, understanding the delicate balance of all things. Your unique perspective allows you to navigate complexity with grace and uncover truths others overlook."
  },
  solarFlare: {
    name: "Solar Flare",
    emoji: "🔥",
    title: "The Fierce Protector",
    description: "Passion burns within you like an unquenchable fire. When you believe in something or someone, your dedication is absolute. You fight tirelessly for what matters most."
  },
  foxy: {
    name: "Foxy",
    emoji: "🦊",
    title: "The Clever Charmer",
    description: "Wit is your weapon and charm your shield. You navigate life with cleverness and adaptability, always ready with a quick solution or a perfectly timed joke to lighten any mood."
  },
  earth: {
    name: "Earth",
    emoji: "🌍",
    title: "The Steadfast Guardian",
    description: "Grounded and reliable, you are the foundation others build upon. Your quiet strength and unwavering loyalty make you the rock that your community can always depend on."
  },
  puppet: {
    name: "Puppet",
    emoji: "🎭",
    title: "The Complex Enigma",
    description: "You are a study in beautiful contradictions. Playful yet profound, simple yet deep—you contain multitudes and reveal different facets of yourself to those who earn your trust."
  },
  monty: {
    name: "Monty",
    emoji: "🐊",
    title: "The Loyal Brother",
    description: "Your bond with family is sacred. You balance humor with genuine care, always ready to support those you consider yours with a mix of laughter and unwavering support."
  },
  bloodmoon: {
    name: "Bloodmoon",
    emoji: "🩸",
    title: "The Intense Defender",
    description: "Your loyalty is fierce and your protection absolute. When you love, you love completely—and anyone who threatens what you value will face your full, unbridled force."
  },
  djMusicMan: {
    name: "DJ Music Man",
    emoji: "🎵",
    title: "The Creative Spirit",
    description: "Rhythm flows through everything you do. You bring harmony and energy to every situation, using your creative talents to elevate moments into memories."
  },
  jackOMoon: {
    name: "Jack O' Moon",
    emoji: "🎃",
    title: "The Playful Trickster",
    description: "Life is your playground and every interaction an opportunity for joy. Your playful spirit and love of harmless fun make you unforgettable to everyone you meet."
  },
  oldMoon: {
    name: "Old Moon",
    emoji: "🌗",
    title: "The Wise Elder",
    description: "Experience has granted you perspective. You see the long game, understanding that patience and wisdom often triumph over haste and impulse."
  },
  ruIN: {
    name: "RuIN",
    emoji: "⚡",
    title: "The Hidden Potential",
    description: "Beneath your reserved exterior lies tremendous power waiting to be unleashed. You are on a journey of self-discovery, learning to embrace the strength within."
  },
  positiveMoon: {
    name: "Positive Moon",
    emoji: "✨",
    title: "The Beacon of Hope",
    description: "Optimism is your superpower. You see the best in everyone and every situation, inspiring hope and lifting spirits even in the darkest times."
  },
  negativeMoon: {
    name: "Negative Moon",
    emoji: "💫",
    title: "The Critical Thinker",
    description: "Your analytical mind questions everything. You seek truth through skepticism, understanding that the best answers come from challenging assumptions."
  }
};

/**
 * Pre-built character prompts for cache optimization
 */
function getCachedCharacterPrompt(character) {
  const profile = CHARACTER_PROFILES[character];
  if (!profile) return null;

  return `CHARACTER PROFILE: ${profile.name} (${profile.emoji})
Title: ${profile.title}
Description: ${profile.description}

This is a SAMS (Sun and Moon System) personality type based on the celestial-themed characters from the beloved universe.`;
}

/**
 * Generate AI explanation using Workers AI runtime
 */
async function generateExplanation(answers, character, env) {
  const characterProfile = CHARACTER_PROFILES[character];
  if (!characterProfile) {
    throw new Error(`Unknown character: ${character}`);
  }

  const cachedPrompt = getCachedCharacterPrompt(character);

  const userPrompt = `
Based on the following quiz answers, explain why this person matched with ${characterProfile.name} (${characterProfile.title}).

Their answers reflect these personality patterns:
${answers.map((a, i) => `${i + 1}. ${a.selectedOption || a}`).join('\n')}

Provide a warm, insightful explanation (2-3 sentences) that:
1. Validates their personality traits
2. Explains why they match this character
3. Offers a gentle insight about their strengths
4. Uses a friendly, encouraging tone

Keep it concise and conversational.`;

  try {
    // Check if AI binding is available
    if (!env.AI) {
      console.log('AI binding not available, using fallback');
      return generateFallbackExplanation(characterProfile);
    }

    // Use Workers AI runtime directly
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `You are a warm, insightful personality guide for the SAMS personality test. You provide thoughtful, encouraging explanations that help people understand themselves better. ${cachedPrompt}`
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 300,
      temperature: 0.8
    });

    return response?.response || generateFallbackExplanation(characterProfile);
  } catch (error) {
    console.error('AI generation error:', error);
    return generateFallbackExplanation(characterProfile);
  }
}

/**
 * Fallback explanation when AI is unavailable
 */
function generateFallbackExplanation(profile) {
  const templates = [
    `You truly embody the spirit of ${profile.name}! Your ${profile.title.toLowerCase()} nature shines through your choices, showing the world your ${profile.emoji} energy.`,
    `As ${profile.name}, you bring ${profile.title.toLowerCase()} energy to everything you do. Your unique perspective is a gift to those around you.`,
    `${profile.name} fits you perfectly! Your answers reveal someone who embodies ${profile.title.toLowerCase()} qualities—exactly what makes this character so special.`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
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
          service: 'SAMS Personality Explanation API',
          version: '1.0.0',
          aiAvailable: !!env.AI,
          characters: Object.keys(CHARACTER_PROFILES)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST request for explanation generation
    if (request.method === 'POST') {
      const body = await request.json();
      const { answers, character } = body;

      // Validation
      if (!character || !CHARACTER_PROFILES[character]) {
        return new Response(
          JSON.stringify({
            error: 'Invalid character',
            validCharacters: Object.keys(CHARACTER_PROFILES)
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!answers || !Array.isArray(answers)) {
        return new Response(
          JSON.stringify({ error: 'Invalid answers array' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Generate explanation
      const explanation = await generateExplanation(answers, character, env);

      return new Response(
        JSON.stringify({
          explanation,
          character: CHARACTER_PROFILES[character],
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
