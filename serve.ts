const port = 3000

const contentTypes: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
}

function getContentType(path: string): string {
  const ext = path.substring(path.lastIndexOf("."))
  return contentTypes[ext] || "application/octet-stream"
}

async function serveFile(path: string): Promise<Response> {
  const filePath = path === "/" ? "/index.html" : path
  const file = Bun.file("." + filePath)
  if (await file.exists()) {
    return new Response(file, {
      headers: { "Content-Type": getContentType(filePath) }
    })
  }
  return new Response("404 Not Found", { status: 404 })
}

async function bundleTS(entrypoint: string): Promise<Response> {
  const result = await Bun.build({
    entrypoints: [entrypoint],
    minify: false,
    sourcemap: "inline"
  })
  if (!result.success) {
    console.error("Build failed:", result.logs)
    return new Response("Build failed", { status: 500 })
  }
  return new Response(result.outputs[0], {
    headers: { "Content-Type": "text/javascript" }
  })
}

Bun.serve({
  port,
  async fetch(request) {
    const path = new URL(request.url).pathname
    if (path === "/app.js") {
      return await bundleTS("./app.ts")
    }
    return await serveFile(path)
  }
})

console.log(`
╔══════════════════════════════════════════════════════════╗
║                       NEMESIS                            ║
║           Every trader needs a Nemesis.                  ║
║                                                          ║
║           http://localhost:${port}                          ║
╚══════════════════════════════════════════════════════════╝
`)
