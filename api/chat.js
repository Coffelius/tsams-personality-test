/**
 * Cloudflare Worker API: /api/chat
 * AI chat assistant for psychological guidance
 * Character: Luna - a fun and slightly cheeky psychological assistant
 *
 * Pricing: 25,608 neurons/M input, 75,147 neurons/M output
 * Free tier: 10K neurons/day
 *
 * Context management: Sliding window for chat history to control token usage
 */

// Luna's personality system prompt (cached)
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
- Avoid being overly clinical or academic

About SAMS (Sun and Moon System):
The SAMS personality test is based on celestial-themed characters from a beloved universe. Each character represents different personality traits:
- Sun types: Radiant, optimistic, energetic leaders
- Moon types: Intuitive, observant, thoughtful wisdom
- Eclipse types: Complex, balanced, mysterious
- Each character has unique strengths and growth areas

Remember: Personality tests are tools for self-reflection, not rigid boxes. Encourage users to explore all facets of themselves!`;

// Quick reference guides (cached to reduce tokens)
const CHARACTER_GUIDES = {
  sun: "☀️ Sun: Radiant optimist who lights up every room with infectious enthusiasm.",
  moon: "🌙 Moon: Intuitive observer with deep wisdom and quiet strength.",
  lunar: "🌖 Lunar: Gentle heart with boundless empathy and emotional intelligence.",
  eclipse: "🌑 Eclipse: Mystical strategist who navigates life's complexities with grace.",
  solarFlare: "🔥 Solar Flare: Fierce protector with unquenchable passion and dedication.",
  foxy: "🦊 Foxy: Clever charmer with wit as a weapon and charm as a shield.",
  earth: "🌍 Earth: Steadfast guardian, the reliable rock others depend on.",
  puppet: "🎭 Puppet: Complex enigma with beautiful contradictions and hidden depths.",
  monty: "🐊 Monty: Loyal brother balancing humor with genuine care.",
  bloodmoon: "🩸 Bloodmoon: Intense defender with fierce, absolute loyalty.",
  djMusicMan: "🎵 DJ Music Man: Creative spirit bringing rhythm and harmony to life.",
  jackOMoon: "🎃 Jack O' Moon: Playful trickster making life a playground of joy.",
  oldMoon: "🌗 Old Moon: Wise elder with patience and long-view perspective.",
  ruIN: "⚡ RuIN: Hidden potential with tremendous power waiting to be unleashed.",
  positiveMoon: "✨ Positive Moon: Beacon of hope seeing the best in everyone.",
  negativeMoon: "💫 Negative Moon: Critical thinker seeking truth through skepticism."
};

/**
 * Truncate chat history for efficient token usage
 * Keeps recent context while managing costs
 */
function truncateChatHistory(chatHistory, maxMessages = 10) {
  if (!Array.isArray(chatHistory)) return [];
  // Keep last N messages to maintain context while controlling token usage
  return chatHistory.slice(-maxMessages);
}

/**
 * Build messages array with context optimization
 */
function buildMessages(chatHistory, userMessage, quizData) {
  const messages = [
    {
      role: 'system',
      content: LUNA_SYSTEM_PROMPT
    }
  ];

  // Add user's quiz context if available (cached character info)
  if (quizData?.result) {
    const character = quizData.result.character;
    const guide = CHARACTER_GUIDES[character];
    if (guide) {
      messages.push({
        role: 'system',
        content: `User's result: ${guide}`
      });
    }
  }

  // Add truncated chat history
  const truncatedHistory = truncateChatHistory(chatHistory);
  truncatedHistory.forEach(msg => {
    messages.push({
      role: msg.role || 'user',
      content: msg.content
    });
  });

  // Add current message
  messages.push({
    role: 'user',
    content: userMessage
  });

  return messages;
}

/**
 * Generate AI response using Workers AI
 */
async function generateChatResponse(messages, env) {
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
          messages,
          max_tokens: 400,
            // Balanced for meaningful but concise responses
          temperature: 0.9
            // Higher temp for more playful, varied responses
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Workers AI request failed: ${error}`);
    }

    const data = await response.json();
    return data.result?.response || getLunaFallbackResponse();
  } catch (error) {
    console.error('Chat AI error:', error);
    return getLunaFallbackResponse();
  }
}

/**
 * Fallback responses when AI is unavailable
 */
function getLunaFallbackResponse() {
  const fallbacks = [
    "Hey there, starlight! 🌟 Luna's taking a quick cosmic nap, but your personality journey is super valid! Keep shining!",
    "Oops! The universe is buffering a bit. But trust me, your results are absolutely stellar! ✨",
    "Technical hiccup, babe! But you know what? Your personality is too awesome to need any AI explanation! 💫"
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
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
            service: 'Luna Chat - SAMS Personality Assistant',
            version: '1.0.0',
            character: 'Luna',
            personality: 'Fun, cheeky, and insightful psychological guide',
            endpoints: {
              chat: 'POST / - Send a message to Luna',
              health: 'GET /health - Check service status'
            },
            pricing: {
              model: '@cf/meta/llama-3.1-8b-instruct',
              neuronsPerMillionInput: 25608,
              neuronsPerMillionOutput: 75147,
              freeTierDaily: 10000,
              estimatedCostPerChat: '~1-3 neurons'
            },
            tips: [
              'Include quizData in your request for personalized responses',
              'Chat history is maintained for context (last 10 messages)',
              'Keep messages concise for optimal performance'
            ]
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Health check
      if (url.pathname === '/health') {
        return new Response(
          JSON.stringify({
            status: 'healthy',
            character: 'Luna',
            timestamp: new Date().toISOString(),
            mood: 'stellar'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // POST request for chat
      if (request.method === 'POST') {
        const body = await request.json();
        const { message, chatHistory = [], quizData } = body;

        // Validation
        if (!message || typeof message !== 'string') {
          return new Response(
            JSON.stringify({ error: 'Message is required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Check message length for cost optimization
        if (message.length > 2000) {
          return new Response(
            JSON.stringify({
              error: 'Message too long',
              maxLength: 2000,
              actualLength: message.length
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Build messages with context optimization
        const messages = buildMessages(chatHistory, message, quizData);

        // Generate response
        const response = await generateChatResponse(messages, env);

        // Estimate neuron usage
        const totalInputChars = messages.reduce((sum, m) => sum + m.content.length, 0);
        const estimatedInputTokens = totalInputChars / 4;
        const estimatedOutputTokens = response.length / 4;
        const neuronUsage = calculateNeuronCost(estimatedInputTokens, estimatedOutputTokens);

        return new Response(
          JSON.stringify({
            response,
            character: 'Luna',
            neuronUsage,
            remainingFreeTier: Math.max(0, 10000 - neuronUsage.total),
            messageCount: chatHistory.length + 1
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
