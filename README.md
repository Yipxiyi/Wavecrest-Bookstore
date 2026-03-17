# 🌊 Wavecrest Bookstore

A modern online bookstore built with Next.js and Supabase.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYipxiyi%2FWavecrest-Bookstore&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=Supabase%20configuration&envLink=https%3A%2F%2Fgithub.com%2FYipxiyi%2FWavecrest-Bookstore%23environment-variables)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Tech Stack

- **Framework:** Next.js 16 + React 19 + TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **External Data:** NeoDB Integration

## Project Structure

```
wavecrest-web/
├── app/                    # Next.js App Router
│   ├── books/             # Book pages
│   │   ├── page.tsx       # Book list
│   │   └── [id]/          # Book detail
│   │       └── page.tsx
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── book/             # Book-related components
│   │   ├── book-list.tsx
│   │   └── book-detail.tsx
│   └── ui/               # UI components
├── lib/                  # Utility libraries
│   └── supabase/        # Supabase clients
│       ├── client.ts    # Browser client
│       ├── server.ts    # Server client
│       └── middleware.ts # Auth middleware
├── types/               # TypeScript types
│   └── database.ts      # Supabase types
├── middleware.ts        # Next.js middleware
└── .env.local.example   # Environment variables template
```

## Getting Started

1. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

2. Add your Supabase credentials to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. Run the database schema:
   ```bash
   # Execute schema.sql in your Supabase SQL Editor
   ```

4. Install dependencies and run:
   ```bash
   npm install
   npm run dev
   ```

## Database Schema

See `../schema.sql` for the complete database schema including:
- `books` - Book information
- `ratings` - Rating data
- `tags` - Book tags/categories
- `purchase_links` - Purchase links from various platforms

## Features

- 📚 Browse curated book collection
- ⭐ View ratings from NeoDB
- 🏷️ Filter by tags
- 🛒 Price comparison across platforms
- 🔒 Row Level Security (RLS) enabled

## License

MIT
