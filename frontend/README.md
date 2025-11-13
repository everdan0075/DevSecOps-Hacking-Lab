# DevSecOps Hacking Lab - Frontend

Interactive web interface for the DevSecOps Hacking Lab security testing platform.

## Features

- **Dark Cybersecurity Theme**: Matrix-inspired UI with green glow effects and terminal aesthetics
- **Real-time Backend Detection**: Hybrid mode that auto-detects if Docker services are running
- **Attack Playground**: Interactive attack scenario execution with live feedback
- **Security Monitoring**: Real-time metrics and Grafana dashboard embeds
- **Incident Response**: Live incident feed from the automated response bot
- **Educational Content**: Interactive documentation and OWASP mapping

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS with custom cyberpunk theme
- **HTTP Client**: Axios with JWT interceptors
- **Icons**: Lucide React
- **Deployment**: GitHub Pages

## Development

### Prerequisites

- Node.js 20+
- npm

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (with backend proxy)
npm run dev

# Open browser to http://localhost:5173
```

**Note**: For full functionality, run the backend Docker stack:

```bash
# From project root
docker-compose up -d
```

### Build for Production

```bash
# Build static files
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/           # Page components
│   ├── services/        # API clients and backend detection
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions and constants
│   ├── App.tsx          # Main app component
│   └── index.css        # Global styles
├── .github/workflows/   # GitHub Actions
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind theme
└── package.json
```

## Backend Integration

### Hybrid Mode

1. **Connected Mode** (local): Real attacks, live metrics, actual data
2. **Disconnected Mode** (GitHub Pages): UI only, backend required message

No fake data or mocked attacks - maintaining integrity.

## Deployment

Automatic deployment to GitHub Pages on push to `main` branch.

## License

MIT License
