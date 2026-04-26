# TSAMS Personality Test - Cloudflare Workers API

Three serverless API endpoints powered by Cloudflare Workers AI with Llama 3.1 8B Instruct.

## APIs

### 1. `/api/explain` - Personality Explanation Generator

Generates AI-powered explanations for personality test results.

**Request:**
```json
POST /api/explain
{
  "answers": ["Answer 1", "Answer 2", ...],
  "character": "sun"
}
```

**Response:**
```json
{
  "explanation": "Your personalized explanation...",
  "character": {
    "name": "Sun",
    "emoji": "☀️",
    "title": "The Radiant Optimist",
    "description": "..."
  },
  "neuronUsage": {
    "input": 512,
    "output": 1234,
    "total": 1746
  },
  "remainingFreeTier": 8254
}
```

**Valid Characters:**
`sun`, `moon`, `lunar`, `eclipse`, `solarFlare`, `foxy`, `earth`, `puppet`, `monty`, `bloodmoon`, `djMusicMan`, `jackOMoon`, `oldMoon`, `ruIN`, `positiveMoon`, `negativeMoon`

### 2. `/api/chat` - Luna AI Assistant

Chat with Luna, a fun psychological guide.

**Request:**
```json
POST /api/chat
{
  "message": "What does it mean to be like Sun?",
  "chatHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "quizData": {
    "result": {
      "character": "sun",
      "percentage": 85
    }
  }
}
```

**Response:**
```json
{
  "response": "Luna's response...",
  "character": "Luna",
  "neuronUsage": {
    "input": 2345,
    "output": 1876,
    "total": 4221
  },
  "remainingFreeTier": 5779,
  "messageCount": 5
}
```

### 3. `/api/followup-questions` - AI-Generated Follow-up Questions

Generates 10 contextual follow-up questions based on quiz results and character match. Questions are organized by topic (love, work, health, relationships, growth) and can be clicked to send to the chat.

**Request:**
```json
POST /api/followup-questions
{
  "answers": ["Answer 1", "Answer 2", ...],
  "character": "sun"
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "How does being Sun affect my love life?",
      "topic": "love"
    },
    {
      "question": "What career suits The Cheerful Caretaker best?",
      "topic": "work"
    },
    ...
  ],
  "character": {
    "key": "sun",
    "name": "Sun",
    "emoji": "☀️",
    "title": "The Cheerful Caretaker",
    "traits": ["Cheerful", "Energetic", "Responsible", "Playful", "Optimistic"]
  },
  "aiPowered": true
}
```

**Topics:**
- `love` — 💕 Love & Relationships (dating, expressing love, ideal partners)
- `work` — 💼 Work & Goals (career paths, workplace conflict, leadership)
- `health` — 🌿 Health & Wellbeing (stress management, self-care, balance)
- `relationships` — 👥 Friendships (making friends, social style, forgiveness)
- `growth` — 🌱 Personal Growth (strengths, confidence, potential, improvement)

## Setup

### 1. Cloudflare Configuration

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Workers & Pages
3. Create a new Worker or add to existing Pages project

### 2. Environment Variables

Set these in your Cloudflare Worker/Pages settings:

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
```

Get your API token from: https://dash.cloudflare.com/profile/api-tokens
Required permissions: `Workers AI Scripts`

### 3. Deploy

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Deploy
cd /path/to/tsams-personality-test
wrangler pages deploy .
```

## Pricing

| Metric | Cost |
|--------|------|
| Input tokens | 25,608 neurons/M |
| Output tokens | 75,147 neurons/M |
| Free tier daily | 10,000 neurons |
| ~1 explanation | ~1,500-2,500 neurons |
| ~1 chat message | ~3,000-5,000 neurons |
| ~1 follow-up questions set | ~2,000-3,000 neurons |

**Estimated daily capacity on free tier:**
- 4-6 explanations
- 2-3 chat conversations
- 3-4 follow-up question sets
- Or combination of all three
- Or combination of both

## Cost Optimization

Both APIs implement these optimizations:

1. **Prompt Caching**: Character descriptions and system prompts are cached
2. **Sliding Window**: Chat history limited to last 10 messages
3. **Token Limits**: `max_tokens` set to 300-400 for efficiency
4. **Fallback Responses**: Template-based responses when AI unavailable

## Development

### Local Testing

Use `wrangler dev` for local development:

```bash
wrangler pages dev . --compatibility-date=2024-01-01
```

### Testing APIs

```bash
# Test explain endpoint
curl -X POST http://localhost:8788/api/explain \
  -H "Content-Type: application/json" \
  -d '{
    "answers": ["Making others happy", "Optimistic"],
    "character": "sun"
  }'

# Test chat endpoint
curl -X POST http://localhost:8788/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about the Sun personality!",
    "chatHistory": []
  }'
```

## Character Reference

All 16 TSAMS characters with their archetypes:

| Character | Title | Emoji |
|-----------|-------|-------|
| Sun | Cheerful Caretaker | ☀️ |
| Moon | Mysterious Guardian | 🌙 |
| Lunar | Gentle Soul | 🌑 |
| Eclipse | Complex Unity | 🌗 |
| Solar Flare | Fiery Protector | 🔥 |
| Foxy | Loyal Pirate | 🦊 |
| Earth | Nurturing Parent | 🌍 |
| Puppet | Mastermind | 🎭 |
| Monty | Confident Competitor | 🐊 |
| Bloodmoon | Calculating Force | 🩸 |
| DJ Music Man | Party Enthusiast | 🎵 |
| Jack O' Moon | Spooky Prankster | 🎃 |
| Old Moon | Enigmatic Elder | 🌘 |
| RuIN | Misunderstood | 💀 |
| Positive Moon | Eternal Optimist | ✨ |
| Negative Moon | Pessimistic Realist | ➖ |

## Error Handling

Both APIs return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad request (invalid input)
- `405` - Method not allowed
- `500` - Internal server error

All errors return JSON with `error` field and optional details.

## License

MIT
