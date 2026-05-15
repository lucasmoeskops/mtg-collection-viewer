# MTG Collection Viewer

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running with Docker (production)

Requires Docker with the Compose plugin installed.

**With a bundled Postgres database** (for local testing):

```bash
docker compose up --build
```

This starts both the app and a Postgres container. The database is empty on first run — restore your data with:

```bash
docker compose exec db psql -U postgres -d mtg < your_dump.sql
```

**Against an existing Postgres server:**

1. Edit `DATABASE_URL` in `docker-compose.prod.yml` to point to your server.
2. Run:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

The app is then available on port 3000.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
