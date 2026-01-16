export const port = parseInt(process.env.PORT || "3000")

const startTime = Date.now()

const contentTypes: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
}

export function getContentType(path: string): string {
  const ext = path.substring(path.lastIndexOf("."))
  return contentTypes[ext] || "application/octet-stream"
}

export function serveHealth(mode: string): Response {
  const mem = process.memoryUsage()
  const heapUsed = Math.round(mem.heapUsed / 1024 / 1024)
  const heapTotal = Math.round(mem.heapTotal / 1024 / 1024)
  const uptime = Date.now() - startTime
  
  return Response.json({
    status: "ok",
    mode,
    timestamp: Date.now(),
    uptime,
    uptimeHuman: formatUptime(uptime),
    memory: {
      heapUsed,
      heapTotal,
      percent: Math.round((heapUsed / heapTotal) * 100),
    },
    version: process.env.BUILD_VERSION || "dev",
  })
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}
