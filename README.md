# CV Review Tool

AI-powered CV review tool that analyzes your CV against a job description, scores it, checks ATS compatibility, and suggests improvements.

## Features

- **CV Input**: Upload PDF/DOCX or paste text directly
- **AI Analysis**: Scores your CV across 5 dimensions (Keyword Match, Skills Alignment, Experience Relevance, Format & Structure, Impact & Metrics)
- **ATS Scan**: Checks if your CV is compatible with Applicant Tracking Systems
- **Suggestions**: Prioritized improvement suggestions with high/medium/low impact
- **Section Rewrite**: AI-powered rewrite for each suggestion — one click to get improved text
- **Multi-language**: Automatically detects CV language and responds accordingly

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **AI**: Claude API (Anthropic)
- **Testing**: Vitest
- **File Parsing**: pdf-parse (PDF), mammoth (DOCX)

## Getting Started

### Prerequisites

- Node.js 18+
- Anthropic API key

### Installation

```bash
git clone https://github.com/quangnb-dev/review-cv.git
cd review-cv
npm install
```

### Configuration

Copy the example env file and add your API key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
ANTHROPIC_API_KEY=your-api-key-here
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_MODEL=claude-sonnet-4-6
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Test

```bash
npm test
```

## License

ISC
