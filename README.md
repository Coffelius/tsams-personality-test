# Sam's Personality Test

A web-based personality assessment quiz built with vanilla HTML, CSS, and JavaScript, designed for deployment on Cloudflare Pages.

## Project Description

This is a simple, interactive personality test that presents users with a series of questions and calculates their personality type based on their answers. The application runs entirely in the browser with no backend dependencies.

## Local Development

Since this is a static site with client-side JavaScript, you can serve it locally using any static file server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (npx)
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Deployment

### Deploy via Cloudflare Pages (Git Integration)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**
4. Select your repository
5. Configure build settings:
   - **Build output directory**: `.`
   - **Root directory**: `examples/sams-personality-test` (if in a monorepo)
   - No build command needed (static files)
6. Click **Save and Deploy**

### Deploy via Wrangler CLI

First, install Wrangler globally:
```bash
npm install -g wrangler
```

Then authenticate with Cloudflare:
```bash
wrangler login
```

Deploy your site:
```bash
cd /Users/me/Projects/ruflo/examples/sams-personality-test
wrangler pages deploy .
```

## Environment Variables

For deployment via Wrangler CLI, you may need to configure:

| Variable | Description | How to Get |
|----------|-------------|------------|
| `CLOUDFLARE_API_TOKEN` | API token for authentication | Create at [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) with **Cloudflare Pages:Edit** permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Found in the [Cloudflare Dashboard](https://dash.cloudflare.com) URL or in the **Workers & Pages** overview page |

### Setting Environment Variables

```bash
# Via command line
export CLOUDFLARE_API_TOKEN=your_token_here
export CLOUDFLARE_ACCOUNT_ID=your_account_id_here

# Or add to your shell profile (~/.zshrc, ~/.bashrc, etc.)
echo 'export CLOUDFLARE_API_TOKEN=your_token_here' >> ~/.zshrc
echo 'export CLOUDFLARE_ACCOUNT_ID=your_account_id_here' >> ~/.zshrc
source ~/.zshrc
```

## Project Structure

```
sams-personality-test/
├── index.html       # Main HTML file
├── style.css        # Stylesheets
├── script.js        # Application logic
├── wrangler.toml    # Cloudflare Pages configuration
├── .gitignore       # Git ignore rules
└── README.md        # This file
```

## License

MIT
