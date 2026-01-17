import { port, serveHealth, staticAssets } from "./serve.shared"
import swTemplate from "./sw.template.js" with { type: "text" }

import indexHtml from "./index.html" with { type: "file" }
import styleCss from "./style.css" with { type: "file" }
import appJs from "./dist/app.js" with { type: "file" }

const BUILD_VERSION = Date.now()

const prodAssets = new Map<string, { filePath: string; contentType: string }>([
  ["/", { filePath: indexHtml, contentType: "text/html" }],
  ["/index.html", { filePath: indexHtml, contentType: "text/html" }],
  ["/style.css", { filePath: styleCss, contentType: "text/css" }],
  ["/app.js", { filePath: appJs, contentType: "text/javascript" }],
  ...staticAssets,
])

async function fetch(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname

  if (path === "/sw.js") {
    const sw = swTemplate.replace(/__CACHE_VERSION__/g, String(BUILD_VERSION))
    return new Response(sw, {
      headers: { "Content-Type": "application/javascript", "Cache-Control": "no-cache" },
    })
  }

  const asset = prodAssets.get(path)
  if (asset) {
    return new Response(Bun.file(asset.filePath), {
      headers: { "Content-Type": asset.contentType },
    })
  }

  if (path === "/health") return serveHealth("production")

  return new Response("404 Not Found", { status: 404 })
}

Bun.serve({ port, fetch, idleTimeout: 0 })
console.log(`\nNEMESIS [${BUILD_VERSION}]\nhttp://localhost:${port}\n`)
