/**
 * ServiceDiagram Component
 *
 * Interactive SVG diagram showing the service mesh architecture
 * with hover effects and connection highlighting
 */

import { useState } from 'react'
import { cn } from '@/utils/cn'

interface ServiceDiagramProps {
  selectedService: string | null
  onServiceSelect: (service: string | null) => void
  isConnected: boolean
}

interface Service {
  id: string
  name: string
  port: number
  x: number
  y: number
  color: string
  type: 'gateway' | 'service' | 'monitoring' | 'storage' | 'proxy'
}

const services: Service[] = [
  // Client (top)
  { id: 'client', name: 'Client', port: 0, x: 400, y: 20, color: '#00d4ff', type: 'gateway' },

  // Gateway layer
  { id: 'traefik', name: 'Traefik', port: 8443, x: 400, y: 100, color: '#00d4ff', type: 'proxy' },
  { id: 'gateway', name: 'API Gateway', port: 8080, x: 400, y: 200, color: '#00ff41', type: 'gateway' },

  // Application layer
  { id: 'auth', name: 'Auth Service', port: 8000, x: 250, y: 320, color: '#00d4ff', type: 'service' },
  { id: 'user', name: 'User Service', port: 8002, x: 550, y: 320, color: '#ff0055', type: 'service' },

  // Storage
  { id: 'redis', name: 'Redis', port: 6379, x: 400, y: 440, color: '#ffaa00', type: 'storage' },

  // Monitoring layer
  { id: 'prometheus', name: 'Prometheus', port: 9090, x: 150, y: 560, color: '#ff6b00', type: 'monitoring' },
  { id: 'alertmanager', name: 'Alertmanager', port: 9093, x: 300, y: 560, color: '#ff6b00', type: 'monitoring' },
  { id: 'incident-bot', name: 'Incident Bot', port: 5002, x: 450, y: 560, color: '#ff6b00', type: 'monitoring' },
  { id: 'grafana', name: 'Grafana', port: 3000, x: 600, y: 560, color: '#ff6b00', type: 'monitoring' },
]

const connections = [
  // Client flow
  { from: 'client', to: 'traefik', type: 'https' },
  { from: 'traefik', to: 'gateway', type: 'http' },

  // Gateway to services
  { from: 'gateway', to: 'auth', type: 'http' },
  { from: 'gateway', to: 'user', type: 'http' },

  // Services to Redis
  { from: 'auth', to: 'redis', type: 'data' },
  { from: 'gateway', to: 'redis', type: 'data' },

  // Monitoring connections
  { from: 'gateway', to: 'prometheus', type: 'metrics' },
  { from: 'auth', to: 'prometheus', type: 'metrics' },
  { from: 'user', to: 'prometheus', type: 'metrics' },
  { from: 'prometheus', to: 'alertmanager', type: 'alert' },
  { from: 'alertmanager', to: 'incident-bot', type: 'webhook' },
  { from: 'prometheus', to: 'grafana', type: 'data' },

  // Direct access (attack path)
  { from: 'client', to: 'auth', type: 'attack' },
  { from: 'client', to: 'user', type: 'attack' },
]

export function ServiceDiagram({ selectedService, onServiceSelect, isConnected }: ServiceDiagramProps) {
  const [hoveredService, setHoveredService] = useState<string | null>(null)

  const activeService = selectedService || hoveredService

  // Get connections for the active service
  const activeConnections = activeService
    ? connections.filter(conn => conn.from === activeService || conn.to === activeService)
    : []

  const isServiceHighlighted = (serviceId: string) => {
    if (!activeService) return false
    if (serviceId === activeService) return true
    return activeConnections.some(conn => conn.from === serviceId || conn.to === serviceId)
  }

  const getConnectionColor = (type: string) => {
    switch (type) {
      case 'https':
      case 'http':
        return '#00ff41'
      case 'data':
        return '#00d4ff'
      case 'metrics':
      case 'alert':
      case 'webhook':
        return '#ff6b00'
      case 'attack':
        return '#ff0055'
      default:
        return '#ffffff'
    }
  }

  const getConnectionDash = (type: string) => {
    return type === 'attack' ? '5,5' : '0'
  }

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox="-50 -50 900 740"
        className="w-full h-auto"
        style={{ minHeight: '500px', maxHeight: '700px' }}
      >
        {/* Background Grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(0, 255, 65, 0.05)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect x="-50" y="-50" width="900" height="740" fill="url(#grid)" />

        {/* Connections */}
        <g className="connections">
          {connections.map((conn, idx) => {
            const fromService = services.find(s => s.id === conn.from)
            const toService = services.find(s => s.id === conn.to)
            if (!fromService || !toService) return null

            const isActive = activeConnections.some(
              c => c.from === conn.from && c.to === conn.to
            )
            const opacity = activeService ? (isActive ? 1 : 0.1) : 0.3

            return (
              <g key={idx}>
                <line
                  x1={fromService.x}
                  y1={fromService.y}
                  x2={toService.x}
                  y2={toService.y}
                  stroke={getConnectionColor(conn.type)}
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={getConnectionDash(conn.type)}
                  opacity={opacity}
                  className="transition-all duration-300"
                />
                {isActive && (
                  <>
                    {/* Animated circle for active connections */}
                    <circle r="4" fill={getConnectionColor(conn.type)}>
                      <animateMotion
                        dur="2s"
                        repeatCount="indefinite"
                        path={`M ${fromService.x} ${fromService.y} L ${toService.x} ${toService.y}`}
                      />
                    </circle>
                    {/* Connection label */}
                    <text
                      x={(fromService.x + toService.x) / 2}
                      y={(fromService.y + toService.y) / 2 - 10}
                      fill={getConnectionColor(conn.type)}
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                      opacity="0.8"
                    >
                      {conn.type}
                    </text>
                  </>
                )}
              </g>
            )
          })}
        </g>

        {/* Services */}
        <g className="services">
          {services.map(service => {
            const isHighlighted = isServiceHighlighted(service.id)
            const isActive = service.id === activeService
            const opacity = activeService ? (isHighlighted ? 1 : 0.3) : 1
            const scale = isActive ? 1.1 : 1

            return (
              <g
                key={service.id}
                transform={`translate(${service.x}, ${service.y}) scale(${scale})`}
                opacity={opacity}
              >
                {/* Invisible larger hit area to prevent flickering */}
                <circle
                  r={60}
                  fill="transparent"
                  style={{ cursor: 'pointer', pointerEvents: 'all' }}
                  onMouseEnter={() => setHoveredService(service.id)}
                  onMouseLeave={() => setHoveredService(null)}
                  onClick={() => onServiceSelect(isActive ? null : service.id)}
                />
                {/* Service node */}
                <circle
                  r={service.id === 'client' ? 30 : 40}
                  fill="rgba(10, 14, 39, 0.95)"
                  stroke={service.color}
                  strokeWidth={isActive ? 3 : 2}
                  style={{ pointerEvents: 'none' }}
                  className="transition-all duration-200"
                />

                {/* Glow effect for active service */}
                {isActive && (
                  <circle
                    r={50}
                    fill="none"
                    stroke={service.color}
                    strokeWidth="1"
                    opacity="0.3"
                    style={{ pointerEvents: 'none' }}
                  >
                    <animate
                      attributeName="r"
                      from="40"
                      to="60"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.5"
                      to="0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Service name */}
                <text
                  y="-8"
                  fill={service.color}
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="monospace"
                  textAnchor="middle"
                  style={{ pointerEvents: 'none' }}
                >
                  {service.name}
                </text>

                {/* Port number */}
                {service.port > 0 && (
                  <text
                    y="8"
                    fill="#888"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                    style={{ pointerEvents: 'none' }}
                  >
                    :{service.port}
                  </text>
                )}

                {/* Status indicator */}
                {service.id !== 'client' && (
                  <circle
                    cx="25"
                    cy="-25"
                    r="4"
                    fill={isConnected ? '#00ff41' : '#666'}
                    className="transition-all duration-300"
                    style={{ pointerEvents: 'none' }}
                  >
                    {isConnected && (
                      <animate
                        attributeName="opacity"
                        values="1;0.5;1"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>
                )}

                {/* Vulnerability indicator */}
                {service.type === 'service' && service.id === 'user' && (
                  <circle
                    cx="-25"
                    cy="-25"
                    r="4"
                    fill="#ff0055"
                    style={{ pointerEvents: 'none' }}
                  >
                    <animate
                      attributeName="opacity"
                      values="1;0.3;1"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            )
          })}
        </g>

        {/* Legend */}
        <g transform="translate(20, 600)">
          <text x="0" y="0" fill="#888" fontSize="10" fontFamily="monospace" fontWeight="600">
            Legend:
          </text>
          <g transform="translate(0, 15)">
            <line x1="0" y1="0" x2="30" y2="0" stroke="#00ff41" strokeWidth="2" />
            <text x="35" y="4" fill="#888" fontSize="9" fontFamily="monospace">HTTP/HTTPS</text>
          </g>
          <g transform="translate(120, 15)">
            <line x1="0" y1="0" x2="30" y2="0" stroke="#00d4ff" strokeWidth="2" />
            <text x="35" y="4" fill="#888" fontSize="9" fontFamily="monospace">Data Flow</text>
          </g>
          <g transform="translate(230, 15)">
            <line x1="0" y1="0" x2="30" y2="0" stroke="#ff6b00" strokeWidth="2" />
            <text x="35" y="4" fill="#888" fontSize="9" fontFamily="monospace">Monitoring</text>
          </g>
          <g transform="translate(340, 15)">
            <line x1="0" y1="0" x2="30" y2="0" stroke="#ff0055" strokeWidth="2" strokeDasharray="5,5" />
            <text x="35" y="4" fill="#888" fontSize="9" fontFamily="monospace">Attack Path</text>
          </g>
        </g>
      </svg>

      {/* Service Details Panel */}
      {activeService && (
        <div className="mt-6 p-4 rounded-lg bg-cyber-bg border border-cyber-border">
          {(() => {
            const service = services.find(s => s.id === activeService)
            if (!service) return null

            const incoming = connections.filter(c => c.to === activeService)
            const outgoing = connections.filter(c => c.from === activeService)

            return (
              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: service.color }}>
                  {service.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Port:</p>
                    <p className="text-gray-300 font-mono">
                      {service.port > 0 ? `:${service.port}` : 'N/A (External)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Type:</p>
                    <p className={cn(
                      'font-mono capitalize',
                      service.type === 'gateway' && 'text-cyber-primary',
                      service.type === 'service' && 'text-cyber-secondary',
                      service.type === 'monitoring' && 'text-cyber-warning',
                      service.type === 'storage' && 'text-cyber-warning',
                      service.type === 'proxy' && 'text-cyber-secondary'
                    )}>
                      {service.type}
                    </p>
                  </div>
                  {incoming.length > 0 && (
                    <div>
                      <p className="text-gray-500 mb-1">Incoming Connections:</p>
                      <ul className="text-gray-400 text-xs space-y-1">
                        {incoming.map((conn, idx) => {
                          const fromSvc = services.find(s => s.id === conn.from)
                          return (
                            <li key={idx} className="font-mono">
                              ← {fromSvc?.name} ({conn.type})
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                  {outgoing.length > 0 && (
                    <div>
                      <p className="text-gray-500 mb-1">Outgoing Connections:</p>
                      <ul className="text-gray-400 text-xs space-y-1">
                        {outgoing.map((conn, idx) => {
                          const toSvc = services.find(s => s.id === conn.to)
                          return (
                            <li key={idx} className="font-mono">
                              → {toSvc?.name} ({conn.type})
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
