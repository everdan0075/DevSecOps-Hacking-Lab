# DevSecOps Hacking Lab - Frontend

Interactive web interface for the DevSecOps Hacking Lab, providing a modern, user-friendly platform to explore attack scenarios, monitor security events, and visualize system architecture.

## Overview

This is a React + TypeScript frontend application built with Vite, featuring:
- Interactive attack scenario execution
- Real-time monitoring dashboards
- System architecture visualization
- Documentation browser
- Cyberpunk-themed UI with custom animations

## Technologies Used

- **React 19** - Modern UI framework with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework with custom cyberpunk theme
- **Recharts** - Composable charting library for metrics visualization
- **React Router** - Client-side routing
- **Axios** - HTTP client for backend API calls
- **Zustand** - Lightweight state management
- **Lucide React** - Beautiful icon library

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Backend Services** (optional but recommended): Docker Compose stack running on `localhost`

## Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

## Development

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at **http://localhost:5173**

### Development Features

- **Hot Module Replacement (HMR)**: Instant updates without full page reload
- **TypeScript Checking**: Real-time type validation
- **ESLint**: Code quality and consistency checks
- **Proxy Configuration**: Backend API calls proxied through Vite dev server

### Proxy Configuration

The Vite dev server proxies requests to backend services:

- `/api/*` → API Gateway (localhost:8080)
- `/auth/*` → API Gateway (localhost:8080)
- `/health` → API Gateway (localhost:8080)
- `/direct/user-service/*` → User Service (localhost:8002)
- `/direct/auth-service/*` → Auth Service (localhost:8000)
- `/prometheus/*` → Prometheus (localhost:9090)
- `/grafana/*` → Grafana (localhost:3000)
- `/incidents/*` → Incident Bot (localhost:5002)

This allows the frontend to communicate with backend services without CORS issues during development.

## Building for Production

Build the optimized production bundle:

```bash
npm run build
```

This creates a `dist/` directory with:
- Minified JavaScript and CSS
- Optimized assets
- Source maps for debugging
- Code splitting for faster loading

### Build Output

```
dist/
├── assets/
│   ├── index-[hash].js       # Main application bundle
│   ├── react-vendor-[hash].js # React libraries
│   ├── charts-[hash].js      # Recharts library
│   ├── query-[hash].js       # React Query
│   └── index-[hash].css      # Compiled styles
├── index.html                # Entry point
└── [other static assets]
```

## Deployment to GitHub Pages

Deploy the built application to GitHub Pages:

```bash
npm run deploy
```

This command:
1. Runs `npm run build` to create production bundle
2. Uses `gh-pages` to deploy `dist/` directory to the `gh-pages` branch
3. GitHub Pages automatically serves the site from this branch

### GitHub Pages Configuration

The app is configured for GitHub Pages deployment in `vite.config.ts`:

```typescript
base: mode === 'production' ? '/DevSecOps-Hacking-Lab/' : '/'
```

**Important**: The `base` path must match your GitHub repository name. Update this in `vite.config.ts` if your repo has a different name.

### Accessing the Deployed Site

After deployment, the site will be available at:
```
https://[your-username].github.io/DevSecOps-Hacking-Lab/
```

## Project Structure

```
frontend/
├── public/              # Static assets (copied as-is to dist/)
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Layout.tsx                   # Main layout with navigation
│   │   ├── BackendStatusIndicator.tsx   # Backend connection status
│   │   ├── AttackCard.tsx               # Attack scenario cards
│   │   ├── AttackExecutionPanel.tsx     # Attack execution UI
│   │   ├── MetricsGrid.tsx              # Metrics display
│   │   ├── ServiceDiagram.tsx           # Interactive architecture diagram
│   │   ├── PortMappingTable.tsx         # Service port mapping
│   │   ├── DataFlowAnimation.tsx        # Request flow visualization
│   │   ├── TechStackBadges.tsx          # Technology badges
│   │   └── [more components...]
│   ├── pages/           # Route pages
│   │   ├── Home.tsx                     # Landing page
│   │   ├── Attacks.tsx                  # Attack scenarios
│   │   ├── Monitoring.tsx               # Metrics and dashboards
│   │   ├── Architecture.tsx             # System architecture
│   │   └── Docs.tsx                     # Documentation browser
│   ├── hooks/           # Custom React hooks
│   │   ├── useBackendStatus.ts          # Backend connection detection
│   │   └── [more hooks...]
│   ├── services/        # API client services
│   │   ├── api.ts                       # Axios configuration
│   │   └── [more services...]
│   ├── contexts/        # React contexts
│   │   └── SecurityContext.tsx          # Security toggle state
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   │   ├── cn.ts                        # Class name merger
│   │   └── constants.ts                 # Constants and configs
│   ├── App.tsx          # Root component with routing
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles with Tailwind
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── vite.config.ts       # Vite configuration
└── README.md            # This file
```

## Backend Integration

### Backend Detection System

The frontend automatically detects backend availability using `useBackendStatus` hook:

```typescript
const { isConnected, checkStatus } = useBackendStatus()
```

This hook:
- Periodically checks `/health` endpoint
- Updates connection status
- Triggers UI changes based on connectivity

### Graceful Degradation

When backend services are offline:
- **Attack Scenarios**: Show warning message, disable execution buttons
- **Monitoring Dashboards**: Display "Backend not connected" message
- **Architecture Page**: Mark services as "unknown" status
- **Overall**: App remains functional with limited features

### CORS Handling

**Development**: Vite proxy handles CORS (no configuration needed)

**Production (GitHub Pages)**:
- Backend services must enable CORS headers
- API Gateway configured to allow GitHub Pages origin
- See `vulnerable-services/api-gateway/app/middleware.py` for CORS settings

## Available Features

### 1. Home Page (`/`)
- Hero section with project overview
- Feature highlights (offensive, defensive, monitoring, incident response)
- Quick start guide
- Backend status indicator

### 2. Attacks Page (`/attacks`)
- **7 Attack Scenarios**:
  1. Brute Force Attack
  2. Credential Stuffing
  3. MFA Bypass
  4. Token Replay
  5. IDOR Exploitation
  6. Gateway Bypass (Direct Access)
  7. Rate Limit Bypass
- Interactive execution panel
- Real-time attack logs
- Results visualization
- Security toggle (enable/disable protections)

### 3. Monitoring Page (`/monitoring`)
- **Real-time Metrics**: Login attempts, MFA verifications, JWT validations
- **Grafana Dashboards**: Embedded dashboards (Auth Security, Attack Visibility, Incident Response)
- **Service Health**: Live status of all microservices
- **Incident Timeline**: Automated incident response events

### 4. Architecture Page (`/architecture`)
- **Interactive Service Diagram**: 11 Docker services with connections
- **Port Mapping Table**: All services with health checks
- **Data Flow Animation**: Normal flow vs. attack paths
- **Security Layers**: Gateway, Application, Monitoring layers
- **Intentional Vulnerabilities**: Educational security flaws
- **Technology Stack**: Comprehensive tech badges

### 5. Documentation Page (`/docs`)
- Markdown documentation browser
- Sidebar navigation
- Table of contents
- Code syntax highlighting
- Search functionality

## Environment Variables

The app uses Vite's environment variable system:

```env
# No environment variables required for basic functionality
# Backend URLs are hardcoded to localhost (dev) or relative paths (prod)
```

For custom backend URLs, modify `vite.config.ts` proxy configuration.

## Scripts

```bash
# Development
npm run dev              # Start dev server on localhost:5173

# Production Build
npm run build            # Build for production (outputs to dist/)
npm run preview          # Preview production build locally

# Deployment
npm run deploy           # Deploy to GitHub Pages

# Code Quality
npm run lint             # Run ESLint
```

## Customization

### Changing Theme Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  cyber: {
    bg: '#0a0e27',           // Background
    surface: '#141b3d',      // Cards/panels
    border: '#1e2a5e',       // Borders
    primary: '#00ff41',      // Matrix green
    secondary: '#00d4ff',    // Cyan
    accent: '#ff00ff',       // Magenta
    danger: '#ff0055',       // Red
    warning: '#ffaa00',      // Orange
    success: '#00ff41',      // Green
  }
}
```

### Adding New Pages

1. Create page component in `src/pages/`
2. Import in `src/App.tsx`
3. Add route to `<Routes>` component
4. Add navigation link in `src/components/Layout.tsx`

### Modifying Attack Scenarios

Edit `src/utils/constants.ts` to add/modify attack scenarios:

```typescript
export const ATTACK_SCENARIOS = [
  {
    id: 'my-attack',
    name: 'My Custom Attack',
    description: '...',
    endpoint: '/api/my-endpoint',
    // ... more config
  }
]
```

## Troubleshooting

### Issue: Backend not connecting

**Solution**:
1. Verify Docker services are running: `docker-compose ps`
2. Check service health: `curl http://localhost:8080/health`
3. Review browser console for CORS errors
4. Verify proxy configuration in `vite.config.ts`

### Issue: Grafana dashboards not loading

**Solution**:
1. Ensure Grafana is running on port 3000
2. Check Grafana CORS settings (should allow `http://localhost:5173`)
3. Verify iframe embedding is enabled in Grafana config

### Issue: Build fails with TypeScript errors

**Solution**:
1. Run `npm install` to ensure all dependencies are installed
2. Check `tsconfig.json` is properly configured
3. Fix type errors shown in console
4. Try `rm -rf node_modules package-lock.json && npm install`

### Issue: GitHub Pages deployment shows 404

**Solution**:
1. Verify `base` path in `vite.config.ts` matches repo name
2. Check GitHub Pages is enabled in repository settings
3. Ensure `gh-pages` branch exists and has content
4. Wait a few minutes for GitHub Pages to update

## Performance Optimization

The build process includes:
- **Code Splitting**: Separate chunks for React, charts, and query libraries
- **Tree Shaking**: Unused code elimination
- **Minification**: JavaScript and CSS minification
- **Asset Optimization**: Image and font optimization
- **Lazy Loading**: Components loaded on-demand (where applicable)

## Browser Support

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+

Modern browsers with ES2020+ support required.

## Contributing

When contributing to the frontend:

1. Follow TypeScript strict mode rules
2. Use existing components and utilities
3. Maintain cyberpunk theme consistency
4. Add proper ARIA labels for accessibility
5. Test on multiple screen sizes
6. Update this README if adding major features

## Recent Updates

### Phase 2.7 (November 2025)
- **Backend Integration Complete**: All 9 missing backend endpoints implemented in incident-bot
- **Full Coverage**: Frontend now has 95%+ backend data access
- **New Endpoints**: Incident reports, active bans, runbooks catalog, gateway health, JWT stats, IDS alerts
- **Production Ready**: All components tested and functional

## License

MIT License - see [LICENSE](../LICENSE) file for details.

---

For backend setup and overall project documentation, see the [main README](../README.md).
