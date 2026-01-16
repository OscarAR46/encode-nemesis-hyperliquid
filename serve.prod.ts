import { port, serveHealth } from "./serve.shared"

import indexHtml from "./index.html" with { type: "file" }
import styleCss from "./style.css" with { type: "file" }
import iconPng from "./icon.png" with { type: "file" }
import appJs from "./dist/app.js" with { type: "file" }
import swTemplate from "./sw.template.js" with { type: "text" }

import fontQuicksand from "./fonts/Quicksand/Quicksand-VariableFont_wght.woff2" with { type: "file" }
import fontCinzel from "./fonts/Cinzel/Cinzel-VariableFont_wght.woff2" with { type: "file" }

import nemesisConcerned from "./nemesis-chan/concerned.png" with { type: "file" }
import nemesisExcited from "./nemesis-chan/excited.png" with { type: "file" }
import nemesisHappy from "./nemesis-chan/happy.png" with { type: "file" }
import nemesisInquisitive from "./nemesis-chan/inquisitive.png" with { type: "file" }
import nemesisKawaii from "./nemesis-chan/kawaii.png" with { type: "file" }
import nemesisLoss from "./nemesis-chan/loss.png" with { type: "file" }
import nemesisPleased from "./nemesis-chan/pleased.png" with { type: "file" }
import nemesisSly from "./nemesis-chan/sly.png" with { type: "file" }
import nemesisTalkative from "./nemesis-chan/talkative.png" with { type: "file" }

const BUILD_VERSION = Date.now()

const assets = new Map<string, { filePath: string; contentType: string }>([
  ["/", { filePath: indexHtml, contentType: "text/html" }],
  ["/index.html", { filePath: indexHtml, contentType: "text/html" }],
  ["/style.css", { filePath: styleCss, contentType: "text/css" }],
  ["/icon.png", { filePath: iconPng, contentType: "image/png" }],
  ["/favicon.ico", { filePath: iconPng, contentType: "image/x-icon" }],
  ["/app.js", { filePath: appJs, contentType: "text/javascript" }],
  ["/fonts/Quicksand/Quicksand-VariableFont_wght.woff2", { filePath: fontQuicksand, contentType: "font/woff2" }],
  ["/fonts/Cinzel/Cinzel-VariableFont_wght.woff2", { filePath: fontCinzel, contentType: "font/woff2" }],
  ["/nemesis-chan/concerned.png", { filePath: nemesisConcerned, contentType: "image/png" }],
  ["/nemesis-chan/excited.png", { filePath: nemesisExcited, contentType: "image/png" }],
  ["/nemesis-chan/happy.png", { filePath: nemesisHappy, contentType: "image/png" }],
  ["/nemesis-chan/inquisitive.png", { filePath: nemesisInquisitive, contentType: "image/png" }],
  ["/nemesis-chan/kawaii.png", { filePath: nemesisKawaii, contentType: "image/png" }],
  ["/nemesis-chan/loss.png", { filePath: nemesisLoss, contentType: "image/png" }],
  ["/nemesis-chan/pleased.png", { filePath: nemesisPleased, contentType: "image/png" }],
  ["/nemesis-chan/sly.png", { filePath: nemesisSly, contentType: "image/png" }],
  ["/nemesis-chan/talkative.png", { filePath: nemesisTalkative, contentType: "image/png" }],
])

async function fetch(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname

  if (path === "/sw.js") {
    const sw = swTemplate.replace(/__CACHE_VERSION__/g, String(BUILD_VERSION))
    return new Response(sw, {
      headers: { "Content-Type": "application/javascript", "Cache-Control": "no-cache" },
    })
  }

  const asset = assets.get(path)
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
