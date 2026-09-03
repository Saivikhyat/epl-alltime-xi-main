# PL All-Time XI — Squad Builder

Build your dream Premier League All-Time XI and get AI-powered tactical analysis.

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Saivikhyat/epl-alltime-xi-main.git
cd epl-alltime-xi-main
npm install
```

### 2. Set Up API Key

Copy the example env file and add your OpenAI API key:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and replace with your key:

```
OPENAI_API_KEY=sk-your-key-here
```

> Get a key at https://platform.openai.com/api-keys

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **50 Premier League legends** — GK, DEF, MID, FWD positions
- **4-3-3 pitch visualization** — click slots to assign players
- **Searchable sidebar** — filter by name, position, or club
- **AI-powered analysis** — tactical summary, rating, and key strengths

## Tech Stack

- [Next.js](https://nextjs.org) 16 + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- OpenAI API for squad rating
