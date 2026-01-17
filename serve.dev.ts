import { watch, watchFile } from "fs"
import { port, getContentType, serveHealth, staticAssets } from "./serve.shared"
import swTemplate from "./sw.template.js" with { type: "text" }

const DEBUG = process.env.DEBUG === "1"
const DEV_BUILD_VERSION = `dev-${Date.now()}`

function log(...args: unknown[]) {
  if (DEBUG) console.log("[DEBUG]", ...args)
}

// Store last build error for the error overlay
let lastBuildError: { message: string; stack: string } | null = null

const errorOverlayStyles = `
  #nemesis-error-overlay {
    position: fixed;
    inset: 0;
    background: rgba(10, 15, 30, 0.98);
    z-index: 99999;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    padding: 20px;
    overflow: auto;
    color: #e8f0ff;
  }
  #nemesis-error-overlay .error-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 100, 100, 0.3);
  }
  #nemesis-error-overlay .error-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 80, 80, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  #nemesis-error-overlay .error-title {
    font-size: 20px;
    font-weight: 600;
    color: #ff6b6b;
  }
  #nemesis-error-overlay .error-subtitle {
    font-size: 12px;
    color: rgba(180, 210, 240, 0.6);
    margin-top: 4px;
  }
  #nemesis-error-overlay .error-type {
    display: inline-block;
    padding: 4px 10px;
    background: rgba(255, 100, 100, 0.15);
    border: 1px solid rgba(255, 100, 100, 0.3);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    color: #ff6b6b;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
  }
  #nemesis-error-overlay .error-message {
    font-size: 16px;
    color: #fff;
    margin-bottom: 16px;
    line-height: 1.5;
    word-break: break-word;
  }
  #nemesis-error-overlay .error-stack {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(100, 180, 255, 0.2);
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.8;
    max-height: 50vh;
    overflow-y: auto;
  }
  #nemesis-error-overlay .error-stack .line {
    white-space: pre-wrap;
    word-break: break-all;
  }
  #nemesis-error-overlay .error-stack .line-error {
    color: #ff6b6b;
    font-weight: 600;
  }
  #nemesis-error-overlay .error-stack .line-file {
    color: #60c0d0;
  }
  #nemesis-error-overlay .error-stack .line-code {
    color: rgba(180, 210, 240, 0.8);
  }
  #nemesis-error-overlay .error-stack .line-hint {
    color: #d4a855;
    font-style: italic;
  }
  #nemesis-error-overlay .error-actions {
    margin-top: 20px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  #nemesis-error-overlay button {
    padding: 10px 20px;
    background: rgba(100, 180, 255, 0.15);
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 6px;
    color: #60c0d0;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  #nemesis-error-overlay button:hover {
    background: rgba(100, 180, 255, 0.25);
    border-color: rgba(100, 180, 255, 0.5);
  }
  #nemesis-error-overlay .dismiss-hint {
    position: fixed;
    bottom: 20px;
    right: 20px;
    font-size: 11px;
    color: rgba(140, 170, 200, 0.5);
  }
  #nemesis-error-overlay .error-timing {
    font-size: 11px;
    color: rgba(140, 170, 200, 0.5);
    margin-top: 16px;
  }
`

function escapeForJS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/\n/g, '\\n')
}

function getDevClientScript(): string {
  const escapedStyles = escapeForJS(errorOverlayStyles)
  
  return `
<script>
(function() {
  var DEBUG = ${DEBUG};
  var startTime = Date.now();
  
  var styles = \`${escapedStyles}\`;
  
  function injectStyles() {
    if (!document.getElementById('nemesis-error-styles')) {
      var style = document.createElement('style');
      style.id = 'nemesis-error-styles';
      style.textContent = styles;
      document.head.appendChild(style);
    }
  }
  
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  
  function formatStack(stack) {
    if (!stack) return '<div class="line line-hint">No stack trace available</div>';
    return stack.split('\\n').map(function(line) {
      var escaped = escapeHtml(line);
      if (line.match(/error/i) && line.includes(':')) {
        return '<div class="line line-error">' + escaped + '</div>';
      }
      if (line.match(/\\.(ts|js|tsx|jsx):\\d+/) || line.match(/^\\s+at\\s/)) {
        return '<div class="line line-file">' + escaped + '</div>';
      }
      if (line.match(/hint:|note:|help:|did you mean/i)) {
        return '<div class="line line-hint">' + escaped + '</div>';
      }
      return '<div class="line line-code">' + escaped + '</div>';
    }).join('');
  }
  
  function showErrorOverlay(type, message, stack, extra) {
    injectStyles();
    
    var existing = document.getElementById('nemesis-error-overlay');
    if (existing) existing.remove();
    
    var overlay = document.createElement('div');
    overlay.id = 'nemesis-error-overlay';
    
    var extraInfo = extra ? '<div class="error-subtitle">' + escapeHtml(extra) + '</div>' : '';
    var timing = 'Error occurred ' + ((Date.now() - startTime) / 1000).toFixed(1) + 's after page load';
    
    overlay.innerHTML = 
      '<div class="error-header">' +
        '<div class="error-icon">💥</div>' +
        '<div>' +
          '<div class="error-title">NEMESIS encountered an error</div>' +
          extraInfo +
        '</div>' +
      '</div>' +
      '<div class="error-type">' + escapeHtml(type) + '</div>' +
      '<div class="error-message">' + escapeHtml(message) + '</div>' +
      '<div class="error-stack">' + formatStack(stack) + '</div>' +
      '<div class="error-actions">' +
        '<button onclick="location.reload()">↻ Reload Page</button>' +
        '<button onclick="this.closest(\\'#nemesis-error-overlay\\').remove()">✕ Dismiss</button>' +
        '<button id="copy-stack-btn">📋 Copy Stack</button>' +
      '</div>' +
      '<div class="error-timing">' + timing + '</div>' +
      '<div class="dismiss-hint">Press Escape to dismiss</div>';
    
    document.body.appendChild(overlay);
    
    document.getElementById('copy-stack-btn').onclick = function() {
      var stackEl = document.querySelector('.error-stack');
      navigator.clipboard.writeText(stackEl.innerText).then(function() {
        document.getElementById('copy-stack-btn').textContent = '✓ Copied!';
      });
    };
    
    var handler = function(e) {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', handler);
      }
    };
    document.addEventListener('keydown', handler);
    
    console.error('[NEMESIS ' + type.toUpperCase() + ']', message);
    if (stack) console.error(stack);
  }
  
  window.__nemesisShowError = showErrorOverlay;
  
  window.addEventListener('error', function(event) {
    var error = event.error || {};
    var filename = event.filename || '';
    var position = event.lineno ? 'Line ' + event.lineno + (event.colno ? ':' + event.colno : '') : '';
    
    showErrorOverlay(
      'Runtime Error',
      error.message || event.message || 'Unknown error',
      error.stack || (filename ? 'at ' + filename + (position ? ' (' + position + ')' : '') : null),
      filename ? 'File: ' + filename + (position ? ' • ' + position : '') : null
    );
  });
  
  window.addEventListener('unhandledrejection', function(event) {
    var reason = event.reason || {};
    var message = reason.message || (typeof reason === 'string' ? reason : 'Promise rejected without reason');
    
    showErrorOverlay(
      'Unhandled Promise Rejection',
      message,
      reason.stack || null,
      'An async operation failed. Check that all promises have .catch() handlers.'
    );
  });
  
  var sse = new EventSource("/__hmr");
  var reconnectAttempts = 0;
  
  sse.onopen = function() {
    reconnectAttempts = 0;
    if (DEBUG) console.log('[HMR] Connected');
  };
  
  sse.onmessage = function(event) {
    try {
      var msg = JSON.parse(event.data);
      
      if (msg.type === "css") {
        document.querySelectorAll('link[rel="stylesheet"]').forEach(function(link) {
          var url = new URL(link.href);
          url.searchParams.set("t", Date.now().toString());
          link.href = url.toString();
        });
        if (DEBUG) console.log("[HMR] CSS updated:", msg.file);
      }
      
      if (msg.type === "build-error") {
        showErrorOverlay(
          'Build Error', 
          msg.message || 'Compilation failed', 
          msg.stack || msg.details || null, 
          'TypeScript/Bundle compilation failed. Fix the error and save to retry.'
        );
      }
      
      if (msg.type === "build-success") {
        var overlay = document.getElementById('nemesis-error-overlay');
        if (overlay) {
          var typeEl = overlay.querySelector('.error-type');
          if (typeEl && typeEl.textContent.includes('Build')) {
            overlay.remove();
            if (DEBUG) console.log('[HMR] Build fixed, reloading...');
            location.reload();
          }
        }
      }
      
      if (msg.type === "reload") {
        if (DEBUG) console.log('[HMR] Full reload requested');
        location.reload();
      }
      
      if (msg.type === "ping") {
        if (DEBUG) console.log('[HMR] Ping received, client:', msg.clientId);
      }
      
    } catch (err) {
      if (DEBUG) console.error('[HMR] Message parse error:', err);
    }
  };
  
  sse.onerror = function() {
    reconnectAttempts++;
    if (DEBUG) console.warn('[HMR] Connection lost, attempt:', reconnectAttempts);
  };
  
  window.__nemesisDebug = {
    showError: showErrorOverlay,
    clearOverlay: function() { 
      var el = document.getElementById('nemesis-error-overlay');
      if (el) el.remove();
    },
    reload: function() { location.reload(); },
    getState: function() {
      if (window.__nemesisState) return window.__nemesisState;
      console.log('%c To expose state, add this to app/state.ts:', 'color: #60c0d0');
      console.log('%c (window as any).__nemesisState = state;', 'color: #d4a855; font-family: monospace');
      return null;
    },
    hmrStatus: function() { 
      return { 
        readyState: ['CONNECTING', 'OPEN', 'CLOSED'][sse.readyState], 
        reconnectAttempts: reconnectAttempts 
      };
    },
    testError: function() { throw new Error('Test error from __nemesisDebug.testError()'); },
    testReject: function() { return Promise.reject(new Error('Test rejection from __nemesisDebug.testReject()')); },
  };
  
  console.log(
    '%c NEMESIS DEV MODE ' + (DEBUG ? '(DEBUG)' : ''),
    'background: linear-gradient(135deg, #0a1628, #1a4a7a); color: #60c0d0; padding: 8px 16px; border-radius: 4px; font-weight: bold;'
  );
  if (DEBUG) {
    console.log('%c Debug helpers: __nemesisDebug', 'color: #60c0d0');
    console.log('%c   .getState()     - View app state', 'color: rgba(180, 210, 240, 0.7)');
    console.log('%c   .showError()    - Show error overlay', 'color: rgba(180, 210, 240, 0.7)');
    console.log('%c   .clearOverlay() - Dismiss error overlay', 'color: rgba(180, 210, 240, 0.7)');
    console.log('%c   .testError()    - Test error handling', 'color: rgba(180, 210, 240, 0.7)');
    console.log('%c   .hmrStatus()    - Check HMR connection', 'color: rgba(180, 210, 240, 0.7)');
  }
  
})();
</script>
`
}

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
      log(`HMR client ${clientId} connected`)
      try {
        const ping = `data: {"type":"ping","clientId":${clientId}}\n\n`
        controller.enqueue(new TextEncoder().encode(ping))
        
        // If there's a pending build error, send it immediately
        if (lastBuildError) {
          const errorMsg = `data: ${JSON.stringify({ 
            type: "build-error", 
            message: lastBuildError.message,
            stack: lastBuildError.stack 
          })}\n\n`
          controller.enqueue(new TextEncoder().encode(errorMsg))
        }
      } catch {}
    },
    cancel() {
      client.closed = true
      hmrClients.delete(client)
      log(`HMR client ${clientId} disconnected`)
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

function broadcast(data: { type: string; [key: string]: unknown }): void {
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
  log(`Bundling ${entrypoint}`)
  const start = Date.now()
  
  try {
    const result = await Bun.build({
      entrypoints: [entrypoint],
      minify: false,
      sourcemap: "inline",
    })

    if (!result.success) {
      const errors = result.logs.map(l => l.message || String(l)).join("\n")
      
      console.error("[BUILD] Failed:")
      result.logs.forEach(l => console.error("  ", l))
      
      // Store error for new clients
      lastBuildError = {
        message: "TypeScript compilation failed",
        stack: errors
      }
      
      // Broadcast to existing clients
      broadcast({ 
        type: "build-error", 
        message: "TypeScript compilation failed",
        stack: errors,
        details: result.logs.map(l => String(l)).join("\n")
      })
      
      // Return JS that shows the error
      const errorScript = `
        console.error("Build failed:", ${JSON.stringify(errors)});
        if (window.__nemesisShowError) {
          window.__nemesisShowError("Build Error", "TypeScript compilation failed", ${JSON.stringify(errors)}, "Fix errors and save to retry");
        } else {
          document.body.innerHTML = '<pre style="color:red;padding:20px;white-space:pre-wrap;background:#0a1628;">Build Error:\\n' + ${JSON.stringify(errors)} + '</pre>';
        }
      `
      return new Response(errorScript, {
        headers: { "Content-Type": "text/javascript" },
      })
    }

    // Clear any previous error
    if (lastBuildError) {
      lastBuildError = null
      broadcast({ type: "build-success" })
    }

    log(`Bundled ${entrypoint} in ${Date.now() - start}ms`)
    return new Response(result.outputs[0], {
      headers: { "Content-Type": "text/javascript" },
    })
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    const errorStack = err instanceof Error ? err.stack : undefined
    
    console.error("[BUILD] Exception:", errorMessage)
    
    lastBuildError = {
      message: errorMessage,
      stack: errorStack || errorMessage
    }
    
    broadcast({ 
      type: "build-error", 
      message: errorMessage,
      stack: errorStack
    })
    
    const errorScript = `
      console.error("Build exception:", ${JSON.stringify(errorMessage)});
      if (window.__nemesisShowError) {
        window.__nemesisShowError("Build Exception", ${JSON.stringify(errorMessage)}, ${JSON.stringify(errorStack)}, "Bundler threw an exception");
      }
    `
    return new Response(errorScript, {
      status: 500,
      headers: { "Content-Type": "text/javascript" },
    })
  }
}

async function serveHtmlWithHMR(filePath: string): Promise<Response> {
  const file = Bun.file(filePath)
  if (!(await file.exists())) return new Response("404 Not Found", { status: 404 })

  let content = await file.text()
  content = content.replace("</body>", `${getDevClientScript()}</body>`)
  
  return new Response(content, { headers: { "Content-Type": "text/html" } })
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname

  log(`${request.method} ${path}`)

  if (path === "/__hmr") return createHMRStream()
  
  if (path === "/__clear-error") {
    lastBuildError = null
    return new Response("OK", { status: 200 })
  }
  
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

console.log(`
╔═══════════════════════════════════════════╗
║  NEMESIS [DEV]${DEBUG ? " - DEBUG MODE" : ""}               ║
║  http://localhost:${port}                      ║
╠═══════════════════════════════════════════╣
║  • Error overlay: Enabled                 ║
║  • HMR: CSS hot reload                    ║
║  • Source maps: Inline                    ║
${DEBUG ? "║  • Debug logging: Enabled                ║\n" : ""}╚═══════════════════════════════════════════╝
`)
