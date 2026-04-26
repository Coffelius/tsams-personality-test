# TSAMS Personality Test

A web-based personality assessment quiz built with vanilla HTML, CSS, and JavaScript, designed for deployment on Cloudflare Pages with AI-powered explanations.

**🔗 Live Demo:** [https://tsams-personality-test.pages.dev/](https://tsams-personality-test.pages.dev/)

## Features

- **16 TSAMS Personality Types**: Discover which celestial-themed character matches your personality
- **Persistent State**: Name, answers, and results saved via localStorage
- **AI Explanations**: Optional Workers AI integration for personalized insights
- **Chat Assistant**: "Luna" - AI chatbot to discuss your results
- **Social Sharing**: Share results via Web Share API
- **Reset/Retake**: Clear data and retake the quiz anytime

## Project Structure

```
tsams-personality-test/
├── index.html       # Main application (all-in-one)
├── api/
│   ├── explain.js   # Workers AI explanation function
│   ├── chat.js      # Luna chat assistant function
│   └── README.md    # API documentation
├── wrangler.toml    # Cloudflare Pages configuration
├── .gitignore       # Git ignore rules
└── README.md        # This file
```

## Local Development

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve .

# Then open http://localhost:8000
```

## Deployment

### Quick Deploy via Wrangler CLI

```bash
# Install and authenticate
npm install -g wrangler
wrangler login

# Deploy
cd /path/to/tsams-personality-test
npx wrangler pages deploy . --project-name=tsams-personality-test
```

### Via Cloudflare Dashboard

1. Push code to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Select your repository
4. Build settings:
   - **Build output directory**: `.`
   - No build command needed
5. Click **Save and Deploy**

## Enabling Workers AI (Optional)

The app works with template-based fallbacks, but for real AI responses:

### Method 1: Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **tsams-personality-test** → **Settings** → **Functions**
3. Scroll to **Bindings** → **Add binding**
4. Configure:
   - **Variable name**: `AI`
   - **Binding type**: `Workers AI`
   - **Model**: (leave blank for access to all)
5. Click **Save** and **Deploy**

### Method 2: Via Wrangler CLI

```bash
npx wrangler pages deployment create --project-name=tsams-personality-test
```

Then add the binding in the dashboard (Method 1).

### Verify AI is Working

After enabling, check the API endpoints:
```bash
# Should show aiAvailable: true
curl https://tsams-personality-test.pages.dev/api/explain
curl https://tsams-personality-test.pages.dev/api/chat
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CLOUDFLARE_API_TOKEN` | API token for deployment | Yes (for CLI deploy) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Yes (for CLI deploy) |

Create an API token at [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) with **Cloudflare Pages:Edit** permissions.

## AI Pricing (Workers AI)

| Resource | Cost |
|----------|------|
| Llama 3.1 8B Instruct | 25,608 neurons/M input, 75,147 neurons/M output |
| Free tier | 10,000 neurons/day |

Each explanation uses ~500-1,000 neurons. Free tier covers ~10-20 explanations daily.

## License

MIT
