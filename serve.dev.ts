import { watch, watchFile } from "fs"
import { port, getContentType, serveHealth } from "./serve.shared"
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

import iconPng from "./icon.png" with { type: "file" }

const DEBUG = process.env.DEBUG === "1"
const DEV_BUILD_VERSION = `dev-${Date.now()}`

/* Static assets baked in at startup - guarantees SW can cache them */
const staticAssets = new Map<string, { filePath: string; contentType: string }>([
  ["/icon.png", { filePath: iconPng, contentType: "image/png" }],
  ["/favicon.ico", { filePath: iconPng, contentType: "image/x-icon" }],
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

function log(...args: unknown[]) {
  if (DEBUG) console.log(...args)
}

const hmrClientScript = `
<script>
(function() {
  const DEBUG = ${DEBUG};
  const sse = new EventSource("/__hmr");
  sse.onmessage = function(event) {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "css") {
        document.querySelectorAll('link[rel="stylesheet"]').forEach(function(link) {
          const url = new URL(link.href);
          url.searchParams.set("t", Date.now().toString());
          link.href = url.toString();
        });
        console.log("[HMR] CSS updated:", msg.file);
      }
    } catch (err) {}
  };
})();
</script>
`

interface HMRClient {
  id: number
  controller: ReadableStreamDefaultController<Uint8Array>
  closed: boolean
  connectedAt: number
}

let clientIdCounter = 0
const hmrClients = new Set<HMRClient>()

function createHMRStream(): Response {
  let client: HMRClient
  const clientId = ++clientIdCounter

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      client = { id: clientId, controller, closed: false, connectedAt: Date.now() }
      hmrClients.add(client)
      try {
        const ping = `data: {"type":"ping","clientId":${clientId}}\n\n`
        controller.enqueue(new TextEncoder().encode(ping))
      } catch {}
    },
    cancel() {
      client.closed = true
      hmrClients.delete(client)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}

function broadcast(data: { type: "css"; file: string }): void {
  const message = `data: ${JSON.stringify(data)}\n\n`
  const encoded = new TextEncoder().encode(message)

  hmrClients.forEach((client) => {
    if (!client.closed) {
      try {
        client.controller.enqueue(encoded)
      } catch {
        client.closed = true
        hmrClients.delete(client)
      }
    }
  })
}

const DEBOUNCE_MS = 50
const POLL_INTERVAL = 100
const debounceTimers = new Map<string, Timer>()
const watchedFiles = new Set<string>()

function watchCssFilePolling(filename: string) {
  if (watchedFiles.has(filename)) return
  watchedFiles.add(filename)
  
  watchFile(filename, { interval: POLL_INTERVAL }, (curr, prev) => {
    if (curr.mtimeMs !== prev.mtimeMs) {
      triggerCssReload(filename)
    }
  })
}

function triggerCssReload(filename: string) {
  const existingTimer = debounceTimers.get(filename)
  if (existingTimer) clearTimeout(existingTimer)
  
  const timer = setTimeout(() => {
    debounceTimers.delete(filename)
    console.log(`[HMR] CSS updated: ${filename}`)
    broadcast({ type: "css", file: filename })
  }, DEBOUNCE_MS)
  
  debounceTimers.set(filename, timer)
}

watchCssFilePolling("style.css")

watch(".", { recursive: true }, (eventType, filename) => {
  if (!filename) return
  if (filename.includes("node_modules") || filename.includes("dist")) return
  
  if (filename.endsWith(".css")) {
    watchCssFilePolling(filename)
    triggerCssReload(filename)
  }
})

async function bundleTypeScript(entrypoint: string): Promise<Response> {
  const result = await Bun.build({
    entrypoints: [entrypoint],
    minify: false,
    sourcemap: "inline",
  })

  if (!result.success) {
    console.error("[BUILD] Failed:", result.logs)
    return new Response("// Build failed\n" + result.logs.join("\n"), {
      status: 500,
      headers: { "Content-Type": "text/javascript" },
    })
  }

  return new Response(result.outputs[0], {
    headers: { "Content-Type": "text/javascript" },
  })
}

async function serveHtmlWithHMR(filePath: string): Promise<Response> {
  const file = Bun.file(filePath)
  if (!(await file.exists())) return new Response("404 Not Found", { status: 404 })

  let content = await file.text()
  content = content.replace("</body>", `${hmrClientScript}</body>`)
  
  return new Response(content, { headers: { "Content-Type": "text/html" } })
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname

  if (path === "/__hmr") return createHMRStream()
  
  if (path === "/sw.js") {
    const sw = swTemplate.replace(/__CACHE_VERSION__/g, DEV_BUILD_VERSION)
    return new Response(sw, {
      headers: { "Content-Type": "application/javascript", "Cache-Control": "no-cache" },
    })
  }
  
  if (path === "/app.js") return await bundleTypeScript("./app.ts")
  if (path === "/health") return serveHealth("development")

  const staticAsset = staticAssets.get(path)
  if (staticAsset) {
    return new Response(Bun.file(staticAsset.filePath), {
      headers: { "Content-Type": staticAsset.contentType },
    })
  }

  const filePath = "." + (path === "/" ? "/index.html" : path)
  const file = Bun.file(filePath)

  if (!(await file.exists())) return new Response("404 Not Found", { status: 404 })
  if (filePath.endsWith(".html")) return await serveHtmlWithHMR(filePath)
  if (filePath.endsWith(".css")) {
    return new Response(file, {
      headers: { "Content-Type": "text/css", "Cache-Control": "no-cache, no-store, must-revalidate" },
    })
  }

  return new Response(file, { headers: { "Content-Type": getContentType(filePath) } })
}

Bun.serve({ port, fetch: handleRequest, idleTimeout: 0 })
console.log(`\nNEMESIS [DEV]${DEBUG ? " - DEBUG" : ""}\nhttp://localhost:${port}\n`)
