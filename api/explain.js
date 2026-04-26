/**
 * Cloudflare Worker API: /api/explain
 * Generates AI-powered personality explanations using Workers AI (Llama 3.1 8B)
 *
 * Pricing: 25,608 neurons/M input, 75,147 neurons/M output
 * Free tier: 10K neurons/day
 *
 * Cost optimization: Character descriptions are cached in prompt cache
 */

// Character descriptions with detailed psychological profiles (cached)
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
 * These static descriptions benefit from Cloudflare's prompt caching
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
 * Generate AI explanation using Workers AI
 * Uses @cf/meta/llama-3.1-8b-instruct model
 */
async function generateExplanation(answers, character, env) {
  const characterProfile = CHARACTER_PROFILES[character];
  if (!characterProfile) {
    throw new Error(`Unknown character: ${character}`);
  }

  // Build prompt with cache-optimized character profile
  const cachedPrompt = getCachedCharacterPrompt(character);

  const userPrompt = `
Based on the following quiz answers, explain why this person matched with ${characterProfile.name} (${characterProfile.title}).

Their answers reflect these personality patterns:
${answers.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Provide a warm, insightful explanation (2-3 sentences) that:
1. Validates their personality traits
2. Explains why they match this character
3. Offers a gentle insight about their strengths
4. Uses a friendly, encouraging tone

Keep it concise and conversational.`;

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
            // Short responses for cost efficiency (75,147 neurons/M output)
          temperature: 0.8
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Workers AI request failed: ${error}`);
    }

    const data = await response.json();
    return data.result?.response || 'Your personality shines brightly! You embody qualities that make you truly unique.';
  } catch (error) {
    console.error('AI generation error:', error);
    // Fallback to template-based explanation
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
 * Calculate neuron usage for monitoring
 */
function calculateNeuronCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1_000_000) * 25_608;
  const outputCost = (outputTokens / 1_000_000) * 75_147;
  return {
    input: Math.round(inputCost),
    output: Math.round(outputCost),
    total: Math.round(inputCost + outputCost)
  };
}

/**
 * Main export for Cloudflare Workers
 */
export default {
  async fetch(request, env, ctx) {
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
            endpoints: {
              explain: 'POST / - Generate AI explanation for personality result',
              health: 'GET /health - Check service status'
            },
            characters: Object.keys(CHARACTER_PROFILES),
            pricing: {
              model: '@cf/meta/llama-3.1-8b-instruct',
              neuronsPerMillionInput: 25608,
              neuronsPerMillionOutput: 75147,
              freeTierDaily: 10000
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Health check
      if (url.pathname === '/health') {
        return new Response(
          JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            characters: Object.keys(CHARACTER_PROFILES).length
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

        // Estimate neuron usage (rough estimate based on prompt + response length)
        const estimatedInputTokens = (getCachedCharacterPrompt(character).length + answers.join(' ').length) / 4;
        const estimatedOutputTokens = explanation.length / 4;
        const neuronUsage = calculateNeuronCost(estimatedInputTokens, estimatedOutputTokens);

        return new Response(
          JSON.stringify({
            explanation,
            character: CHARACTER_PROFILES[character],
            neuronUsage,
            remainingFreeTier: Math.max(0, 10000 - neuronUsage.total)
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
};
