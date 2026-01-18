import { port, getContentType, serveHealth } from "./serve.shared"
import { handleLedgerRoutes, handleCorsPreflightForLedger } from "./api/ledger"
import swTemplate from "./sw.template.js" with { type: "text" }

// Core files
import indexHtml from "./index.html" with { type: "file" }
import styleCss from "./style.css" with { type: "file" }
import appJs from "./dist/app.js" with { type: "file" }
import iconPng from "./icon.png" with { type: "file" }

// CSS modules
import cssBase from "./css/base.css" with { type: "file" }
import cssBackgrounds from "./css/backgrounds.css" with { type: "file" }
import cssTitle from "./css/title.css" with { type: "file" }
import cssCrt from "./css/crt.css" with { type: "file" }
import cssDialogue from "./css/dialogue.css" with { type: "file" }
import cssHeader from "./css/header.css" with { type: "file" }
import cssAvatar from "./css/avatar.css" with { type: "file" }
import cssPanels from "./css/panels.css" with { type: "file" }
import cssPages from "./css/pages.css" with { type: "file" }
import cssConnection from "./css/connection.css" with { type: "file" }
import cssWallet from "./css/wallet.css" with { type: "file" }
import cssBattle from "./css/battle.css" with { type: "file" }
import cssBridge from "./css/bridge.css" with { type: "file" }
import cssEditMode from "./css/edit-mode.css" with { type: "file" }
import cssUtils from "./css/utils.css" with { type: "file" }
import cssResponsive from "./css/responsive.css" with { type: "file" }

// Fonts
import fontQuicksand from "./fonts/Quicksand/Quicksand-VariableFont_wght.woff2" with { type: "file" }
import fontCinzel from "./fonts/Cinzel/Cinzel-VariableFont_wght.woff2" with { type: "file" }

// Nemesis-chan sprites
import nemesisConcerned from "./nemesis-chan/concerned.png" with { type: "file" }
import nemesisExcited from "./nemesis-chan/excited.png" with { type: "file" }
import nemesisHappy from "./nemesis-chan/happy.png" with { type: "file" }
import nemesisInquisitive from "./nemesis-chan/inquisitive.png" with { type: "file" }
import nemesisIntro from "./nemesis-chan/intro.png" with { type: "file" }
import nemesisKawaii from "./nemesis-chan/kawaii.png" with { type: "file" }
import nemesisLoss from "./nemesis-chan/loss.png" with { type: "file" }
import nemesisPleased from "./nemesis-chan/pleased.png" with { type: "file" }
import nemesisSly from "./nemesis-chan/sly.png" with { type: "file" }
import nemesisTalkative from "./nemesis-chan/talkative.png" with { type: "file" }

const BUILD_VERSION = Date.now()

const prodAssets = new Map<string, { filePath: string; contentType: string }>([
  // Core
  ["/", { filePath: indexHtml, contentType: "text/html" }],
  ["/index.html", { filePath: indexHtml, contentType: "text/html" }],
  ["/style.css", { filePath: styleCss, contentType: "text/css" }],
  ["/app.js", { filePath: appJs, contentType: "text/javascript" }],
  ["/icon.png", { filePath: iconPng, contentType: "image/png" }],

  // CSS modules
  ["/css/base.css", { filePath: cssBase, contentType: "text/css" }],
  ["/css/backgrounds.css", { filePath: cssBackgrounds, contentType: "text/css" }],
  ["/css/title.css", { filePath: cssTitle, contentType: "text/css" }],
  ["/css/crt.css", { filePath: cssCrt, contentType: "text/css" }],
  ["/css/dialogue.css", { filePath: cssDialogue, contentType: "text/css" }],
  ["/css/header.css", { filePath: cssHeader, contentType: "text/css" }],
  ["/css/avatar.css", { filePath: cssAvatar, contentType: "text/css" }],
  ["/css/panels.css", { filePath: cssPanels, contentType: "text/css" }],
  ["/css/pages.css", { filePath: cssPages, contentType: "text/css" }],
  ["/css/connection.css", { filePath: cssConnection, contentType: "text/css" }],
  ["/css/wallet.css", { filePath: cssWallet, contentType: "text/css" }],
  ["/css/battle.css", { filePath: cssBattle, contentType: "text/css" }],
  ["/css/bridge.css", { filePath: cssBridge, contentType: "text/css" }],
  ["/css/edit-mode.css", { filePath: cssEditMode, contentType: "text/css" }],
  ["/css/utils.css", { filePath: cssUtils, contentType: "text/css" }],
  ["/css/responsive.css", { filePath: cssResponsive, contentType: "text/css" }],

  // Fonts
  ["/fonts/Quicksand/Quicksand-VariableFont_wght.woff2", { filePath: fontQuicksand, contentType: "font/woff2" }],
  ["/fonts/Cinzel/Cinzel-VariableFont_wght.woff2", { filePath: fontCinzel, contentType: "font/woff2" }],

  // Nemesis-chan sprites
  ["/nemesis-chan/concerned.png", { filePath: nemesisConcerned, contentType: "image/png" }],
  ["/nemesis-chan/excited.png", { filePath: nemesisExcited, contentType: "image/png" }],
  ["/nemesis-chan/happy.png", { filePath: nemesisHappy, contentType: "image/png" }],
  ["/nemesis-chan/inquisitive.png", { filePath: nemesisInquisitive, contentType: "image/png" }],
  ["/nemesis-chan/intro.png", { filePath: nemesisIntro, contentType: "image/png" }],
  ["/nemesis-chan/kawaii.png", { filePath: nemesisKawaii, contentType: "image/png" }],
  ["/nemesis-chan/loss.png", { filePath: nemesisLoss, contentType: "image/png" }],
  ["/nemesis-chan/pleased.png", { filePath: nemesisPleased, contentType: "image/png" }],
  ["/nemesis-chan/sly.png", { filePath: nemesisSly, contentType: "image/png" }],
  ["/nemesis-chan/talkative.png", { filePath: nemesisTalkative, contentType: "image/png" }],
])

async function fetch(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname

  // Handle CORS preflight for Ledger API
  if (request.method === 'OPTIONS') {
    const corsResponse = handleCorsPreflightForLedger(path)
    if (corsResponse) return corsResponse
  }

  // Ledger API routes (before static file handling)
  const ledgerResponse = await handleLedgerRoutes(path, url)
  if (ledgerResponse) return ledgerResponse

  if (path === "/sw.js") {
    const sw = swTemplate.replace(/__CACHE_VERSION__/g, String(BUILD_VERSION))
    return new Response(sw, {
      headers: { "Content-Type": "application/javascript", "Cache-Control": "no-cache" },
    })
  }

  if (path === "/health") return serveHealth("production")

  const asset = prodAssets.get(path)
  if (asset) {
    return new Response(Bun.file(asset.filePath), {
      headers: { "Content-Type": asset.contentType },
    })
  }

  return new Response("404 Not Found", { status: 404 })
}

Bun.serve({ port, fetch, idleTimeout: 0 })
console.log(`

  NEMESIS [${BUILD_VERSION}]
  http://localhost:${port}

  • Mode: Production
  • Ledger API: /v1/*
  • Assets: ${prodAssets.size} files cached
`)
