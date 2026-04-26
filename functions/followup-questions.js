/**
 * Cloudflare Pages Function: /api/followup-questions
 * Generates AI-powered follow-up questions based on quiz results and character
 *
 * Uses built-in AI binding - no API tokens needed
 */

// Character profiles for context
const CHARACTER_PROFILES = {
  sun: {
    name: "Sun",
    emoji: "☀️",
    title: "The Cheerful Caretaker",
    traits: ["Cheerful", "Energetic", "Responsible", "Playful", "Optimistic"]
  },
  moon: {
    name: "Moon",
    emoji: "🌙",
    title: "The Mysterious Guardian",
    traits: ["Mysterious", "Calm", "Strategic", "Thoughtful", "Independent"]
  },
  lunar: {
    name: "Lunar",
    emoji: "🌑",
    title: "The Gentle Soul",
    traits: ["Innocent", "Sweet", "Curious", "Kind-hearted", "Loving"]
  },
  eclipse: {
    name: "Eclipse",
    emoji: "🌗",
    title: "The Complex Unity",
    traits: ["Balanced", "Complex", "Wise", "Harmonious", "Integrated"]
  },
  solarFlare: {
    name: "Solar Flare",
    emoji: "🔥",
    title: "The Fiery Protector",
    traits: ["Fierce", "Loyal", "Protective", "Intense", "Courageous"]
  },
  foxy: {
    name: "Foxy",
    emoji: "🦊",
    title: "The Loyal Pirate",
    traits: ["Loyal", "Chaotic", "Adventurous", "Friendly", "Devoted"]
  },
  earth: {
    name: "Earth",
    emoji: "🌍",
    title: "The Nurturing Parent",
    traits: ["Nurturing", "Patient", "Wise", "Protective", "Grounding"]
  },
  puppet: {
    name: "Puppet",
    emoji: "🎭",
    title: "The Mastermind",
    traits: ["Observant", "Strategic", "Influential", "Intelligent", "Patient"]
  },
  monty: {
    name: "Monty",
    emoji: "🐊",
    title: "The Confident Competitor",
    traits: ["Confident", "Athletic", "Competitive", "Proud", "Loyal"]
  },
  bloodmoon: {
    name: "Bloodmoon",
    emoji: "🩸",
    title: "The Calculating Force",
    traits: ["Strategic", "Intense", "Calculated", "Complex", "Powerful"]
  },
  djMusicMan: {
    name: "DJ Music Man",
    emoji: "🎧",
    title: "The Party Enthusiast",
    traits: ["Enthusiastic", "Friendly", "Energetic", "Peaceful", "Creative"]
  },
  jackOMoon: {
    name: "Jack-O-Moon",
    emoji: "🎃",
    title: "The Spooky Prankster",
    traits: ["Mischievous", "Playful", "Spooky", "Fun-loving", "Creative"]
  },
  oldMoon: {
    name: "Old Moon",
    emoji: "🌘",
    title: "The Enigmatic Elder",
    traits: ["Wise", "Mysterious", "Experienced", "Ominous", "Deep"]
  },
  ruIN: {
    name: "Ruin",
    emoji: "💀",
    title: "The Misunderstood",
    traits: ["Misunderstood", "Complex", "Resilient", "Searching", "Guarded"]
  },
  positiveMoon: {
    name: "Positive Moon",
    emoji: "✨",
    title: "The Eternal Optimist",
    traits: ["Optimistic", "Hopeful", "Encouraging", "Believing", "Upbeat"]
  },
  negativeMoon: {
    name: "Negative Moon",
    emoji: "➖",
    title: "The Pessimistic Realist",
    traits: ["Realistic", "Pessimistic", "Protective", "Skeptical", "Cautious"]
  }
};

// Topic categories with icons
const TOPICS = {
  love: { icon: "💕", label: "Love & Relationships" },
  work: { icon: "💼", label: "Work & Goals" },
  health: { icon: "🌿", label: "Health & Wellbeing" },
  relationships: { icon: "👥", label: "Friendships" },
  growth: { icon: "🌱", label: "Personal Growth" }
};

/**
 * Generate follow-up questions using Workers AI
 */
async function generateFollowupQuestions(answers, character, env) {
  const profile = CHARACTER_PROFILES[character];
  if (!profile) {
    return generateFallbackQuestions(character);
  }

  const cachedPrompt = `CHARACTER PROFILE: ${profile.name} (${profile.emoji})
Title: ${profile.title}
Traits: ${profile.traits.join(', ')}

You are helping generate 10 follow-up questions for a personality quiz result.
The user just matched with ${profile.name} (${profile.title}).

The questions should be:
- Thoughtful and personalized based on their character match
- Cover different life topics: love/relationships, work/career, health/wellbeing, friendships, personal growth
- Open-ended to encourage meaningful conversation
- 8-15 words each
- Conversational and engaging tone`;

  const userPrompt = `Based on the user's quiz answers below, generate 10 personalized follow-up questions they can ask about their ${profile.name} personality result.

Their answers:
${answers.map((a, i) => `${i + 1}. ${a.selectedOption || a}`).join('\n')}

Generate 10 questions as a JSON array of objects with:
- "question": the question text
- "topic": one of: love, work, health, relationships, growth

Return ONLY the JSON array, no other text.`;

  try {
    // Check if AI binding is available
    if (!env.AI) {
      console.log('AI binding not available, using fallback');
      return generateFallbackQuestions(character);
    }

    // Use Workers AI runtime
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: cachedPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.9
    });

    const aiResponse = response?.response || '';

    // Try to parse JSON from AI response
    try {
      // Extract JSON array from response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        if (Array.isArray(questions) && questions.length >= 5) {
          return questions.slice(0, 10).map(q => ({
            question: q.question,
            topic: q.topic || 'growth'
          }));
        }
      }
    } catch (parseError) {
      console.log('JSON parse error, using fallback');
    }

    // Fallback to generated questions
    return generateFallbackQuestions(character);
  } catch (error) {
    console.error('AI generation error:', error);
    return generateFallbackQuestions(character);
  }
}

/**
 * Generate fallback questions when AI is unavailable
 */
function generateFallbackQuestions(character) {
  const profile = CHARACTER_PROFILES[character];

  // Base questions with character-specific customization
  const baseQuestions = [
    {
      question: `How does being ${profile.name} affect my relationships?`,
      topic: 'love'
    },
    {
      question: `What career paths suit ${profile.title} like me?`,
      topic: 'work'
    },
    {
      question: `How can I maintain balance as ${profile.name}?`,
      topic: 'health'
    },
    {
      question: `Who are ${profile.name}'s best friend matches?`,
      topic: 'relationships'
    },
    {
      question: `What's ${profile.name}'s biggest strength?`,
      topic: 'growth'
    },
    {
      question: `How does ${profile.name} handle stress?`,
      topic: 'health'
    },
    {
      question: `What should ${profile.name} work on improving?`,
      topic: 'growth'
    },
    {
      question: `How do I find love as ${profile.name}?`,
      topic: 'love'
    },
    {
      question: `What makes ${profile.name} unique?`,
      topic: 'growth'
    },
    {
      question: `Can ${profile.name} change over time?`,
      topic: 'growth'
    }
  ];

  // Character-specific additions
  const characterQuestions = {
    sun: [
      { question: "How do I stay positive when things get hard?", topic: 'health' },
      { question: "What if I'm too energetic for some people?", topic: 'relationships' }
    ],
    moon: [
      { question: "How do I open up without losing myself?", topic: 'relationships' },
      { question: "Is it okay to need so much alone time?", topic: 'health' }
    ],
    lunar: [
      { question: "How do I stay kind in a harsh world?", topic: 'growth' },
      { question: "What if people take advantage of my innocence?", topic: 'relationships' }
    ],
    eclipse: [
      { question: "How do I resolve my inner conflicts?", topic: 'health' },
      { question: "Can I ever find true balance?", topic: 'growth' }
    ],
    solarFlare: [
      { question: "How do I control my protective instincts?", topic: 'relationships' },
      { question: "What if my anger hurts those I love?", topic: 'health' }
    ],
    foxy: [
      { question: "How do I balance fun with responsibility?", topic: 'work' },
      { question: "What makes a true friend to Foxy?", topic: 'relationships' }
    ],
    earth: [
      { question: "How do I stop taking care of everyone?", topic: 'health' },
      { question: "What if my guidance isn't wanted?", topic: 'relationships' }
    ],
    puppet: [
      { question: "How do I trust without controlling?", topic: 'relationships' },
      { question: "Is it lonely always knowing what happens next?", topic: 'health' }
    ],
    bloodmoon: [
      { question: "Can someone like me find redemption?", topic: 'growth' },
      { question: "How do I show vulnerability?", topic: 'relationships' }
    ],
    ruIN: [
      { question: "How do I move past my scars?", topic: 'growth' },
      { question: "Will anyone understand the real me?", topic: 'relationships' }
    ]
  };

  // Combine and return
  const specific = characterQuestions[character] || [];
  return [...baseQuestions.slice(0, 10 - specific.length), ...specific].slice(0, 10);
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
    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({
          service: 'Follow-up Questions API',
          version: '1.0.0',
          aiAvailable: !!env.AI,
          topics: TOPICS
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

      // Generate questions
      const questions = await generateFollowupQuestions(answers, character, env);

      return new Response(
        JSON.stringify({
          questions,
          character: {
            key: character,
            ...CHARACTER_PROFILES[character]
          },
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
