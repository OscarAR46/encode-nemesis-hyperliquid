const port = 3000
const staticDir = "."

const contentTypes: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf"
}

function getContentType(path: string): string {
  const ext = path.substring(path.lastIndexOf("."))
  return contentTypes[ext] || "application/octet-stream"
}

async function serveFile(path: string): Promise<Response> {
  const filePath = path === "/" ? "/index.html" : path
  const file = Bun.file(staticDir + filePath)

  if (await file.exists()) {
    return new Response(file, {
      headers: { "Content-Type": getContentType(filePath) }
    })
  }

  return notFound()
}

async function bundleTS(entrypoint: string): Promise<Response> {
  const result = await Bun.build({
    entrypoints: [entrypoint],
    minify: false,
    sourcemap: "inline"
  })

  if (!result.success) {
    console.error("Build failed:", result.logs)
    return new Response(`Build failed:\n${result.logs.join('\n')}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    })
  }

  return new Response(result.outputs[0], {
    headers: { "Content-Type": "text/javascript" }
  })
}

function notFound(): Response {
  return new Response("404 Not Found", {
    status: 404,
    headers: { "Content-Type": "text/plain" }
  })
}

function log(request: Request, status: number, duration: number): void {
  const timestamp = new Date().toISOString()
  const method = request.method
  const path = new URL(request.url).pathname
  console.log(`${timestamp} ${method} ${path} ${status} ${duration}ms`)
}

Bun.serve({
  port,
  async fetch(request) {
    const start = performance.now()
    const path = new URL(request.url).pathname

    let response: Response

    if (path === "/app.js") {
      response = await bundleTS("./app.ts")
    } else {
      response = await serveFile(path)
    }

    log(request, response.status, Math.round(performance.now() - start))
    return response
  }
})

console.log(`
╔═══════════════════════════════════════════════╗
║         NEMESIS Trading Terminal              ║
║   "Every trade needs a Nemesis."              ║
║   http://localhost:${port}                       ║
╚═══════════════════════════════════════════════╝
`)
