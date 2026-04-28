const http = require("node:http");
const { URL } = require("node:url");
const animekai = require("./animekai");
const anizone = require("./anizone");
const animeheaven = require("./animeheaven");
const hianime = require("./hianime");
const metadata = require("./metadata");
const mangakatana = require("./mangakatana");

const PORT = Number(process.env.PORT || 4517);
const VERSION = "1.0.0";
const resolvers = {
  animeheaven,
  hianime,
  animekai,
  anizone
};
const sources = [animeheaven.SOURCE, hianime.SOURCE, animekai.SOURCE, anizone.SOURCE];

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(body, null, 2));
}

function notFound(res) {
  sendJson(res, 404, { error: "Not found" });
}

function serviceIndex(req) {
  const origin = `http://${req.headers.host}`;
  return {
    name: "FerAnime API",
    version: VERSION,
    status: "ok",
    docs: `${origin}/docs`,
    endpoints: {
      health: "/health",
      sources: "/api/sources",
      animeSearch: "/api/anime/search?sourceId=anizone&q=naruto",
      animeCatalog: "/api/anime/catalog?sourceId=anizone&section=trending",
      animeDetails: "/api/anime/:sourceId/:animeId",
      animeEpisodes: "/api/anime/:sourceId/:animeId/episodes",
      episodeStreams: "/api/episodes/:sourceId/:episodeId/streams",
      showMetadata: "/api/meta/show?title=naruto",
      episodeMetadata: "/api/meta/episodes?title=naruto&malId=20",
      mangaList: "/api/manga/list?type=latest&page=1",
      mangaSearch: "/api/manga/search?q=naruto&page=1",
      mangaDetails: "/api/manga/:mangaId",
      mangaChapter: "/api/manga/:mangaId/:chapterId"
    }
  };
}

function docsHtml(req) {
  const origin = `http://${req.headers.host}`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FerAnime API</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0b0b0c; color: #f5f5f7; }
    main { max-width: 980px; margin: 0 auto; padding: 48px 20px 80px; }
    h1 { font-size: clamp(38px, 7vw, 76px); line-height: .95; margin: 0 0 14px; letter-spacing: -0.04em; }
    h2 { margin-top: 36px; color: #8ec5ff; }
    p { color: #b7b7bd; font-size: 17px; line-height: 1.6; }
    code, pre { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
    pre { background: #17171a; border: 1px solid #2a2a30; border-radius: 14px; padding: 16px; overflow: auto; }
    a { color: #8ec5ff; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
    .card { background: #151518; border: 1px solid #27272d; border-radius: 18px; padding: 16px; }
  </style>
</head>
<body>
  <main>
    <h1>FerAnime API</h1>
    <p>A standalone JSON service for anime source lookup, episode discovery, stream resolution, metadata, and MangaKatana manga reading endpoints.</p>
    <p>Base URL: <code>${origin}</code></p>
    <h2>Quick Test</h2>
    <pre>curl ${origin}/health
curl "${origin}/api/anime/search?sourceId=anizone&q=naruto"
curl "${origin}/api/manga/search?q=naruto"</pre>
    <h2>Endpoint Groups</h2>
    <div class="grid">
      <div class="card"><strong>Anime</strong><p>Search, catalog, details, episodes, and stream resolution.</p><code>/api/anime/search</code></div>
      <div class="card"><strong>Manga</strong><p>MangaKatana list, search, details, chapters, and page images.</p><code>/api/manga/search</code></div>
      <div class="card"><strong>Metadata</strong><p>Jikan show metadata and episode metadata helpers.</p><code>/api/meta/show</code></div>
    </div>
    <h2>OpenAPI</h2>
    <p>Machine-readable endpoint summary is available at <a href="/openapi.json">/openapi.json</a>.</p>
  </main>
</body>
</html>`;
}

function sendHtml(res, html) {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(html);
}

async function handle(req, res) {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean);

  try {
    if (url.pathname === "/" || url.pathname === "/api") {
      sendJson(res, 200, serviceIndex(req));
      return;
    }

    if (url.pathname === "/docs") {
      sendHtml(res, docsHtml(req));
      return;
    }

    if (url.pathname === "/openapi.json") {
      sendJson(res, 200, openApi(req));
      return;
    }

    if (url.pathname === "/health") {
      sendJson(res, 200, {
        ok: true,
        service: "feranime-api",
        version: VERSION,
        animeSources: sources.map((source) => source.id),
        mangaSources: [mangakatana.SOURCE.id]
      });
      return;
    }

    if (url.pathname === "/api/sources") {
      sendJson(res, 200, { anime: sources, manga: [mangakatana.SOURCE] });
      return;
    }

    if (url.pathname === "/api/manga/list" || url.pathname === "/api/mangaList") {
      sendJson(
        res,
        200,
        await mangakatana.list({
          page: Number(url.searchParams.get("page") || 1),
          type: url.searchParams.get("type") || "latest",
          category: url.searchParams.get("category") || "all",
          state: url.searchParams.get("state") || "all"
        })
      );
      return;
    }

    if (url.pathname === "/api/manga/search") {
      sendJson(res, 200, await mangakatana.search(url.searchParams.get("q") || "", Number(url.searchParams.get("page") || 1)));
      return;
    }

    if (parts[0] === "api" && parts[1] === "search" && parts[2]) {
      sendJson(res, 200, await mangakatana.search(decodeURIComponent(parts[2]), Number(url.searchParams.get("page") || 1)));
      return;
    }

    if (parts[0] === "api" && parts[1] === "manga" && parts[2]) {
      if (parts[3]) {
        sendJson(res, 200, await mangakatana.chapter(decodeURIComponent(parts[2]), decodeURIComponent(parts[3])));
        return;
      }
      sendJson(res, 200, await mangakatana.detail(decodeURIComponent(parts[2])));
      return;
    }

    if (url.pathname === "/api/anime/search") {
      const sourceId = url.searchParams.get("sourceId") || "animeheaven";
      const resolver = resolvers[sourceId];
      if (!resolver) return notFound(res);
      sendJson(res, 200, await resolver.search(url.searchParams.get("q") || "", Number(url.searchParams.get("page") || 1)));
      return;
    }

    if (url.pathname === "/api/anime/catalog") {
      const sourceId = url.searchParams.get("sourceId") || "animeheaven";
      const resolver = resolvers[sourceId];
      if (!resolver || !resolver.catalog) return notFound(res);
      sendJson(res, 200, await resolver.catalog(url.searchParams.get("section") || "recommended"));
      return;
    }

    if (url.pathname === "/api/meta/show") {
      const title = url.searchParams.get("title") || "";
      if (!title.trim()) return sendJson(res, 400, { error: "Missing title" });
      sendJson(res, 200, { item: await metadata.showMetadata(title) });
      return;
    }

    if (url.pathname === "/api/meta/episodes") {
      sendJson(
        res,
        200,
        await metadata.episodeMetadata({
          title: url.searchParams.get("title") || "",
          malId: url.searchParams.get("malId") || "",
          anidbId: url.searchParams.get("anidbId") || ""
        })
      );
      return;
    }

    if (parts[0] === "api" && parts[1] === "anime" && parts[2] && parts[3]) {
      const resolver = resolvers[parts[2]];
      if (!resolver) return notFound(res);
      const id = decodeURIComponent(parts[3]);
      if (parts[4] === "episodes") {
        sendJson(res, 200, { items: await resolver.episodes(id) });
        return;
      }
      sendJson(res, 200, await resolver.details(id));
      return;
    }

    if (parts[0] === "api" && parts[1] === "episodes" && parts[2] && parts[3] && parts[4] === "streams") {
      const resolver = resolvers[parts[2]];
      if (!resolver) return notFound(res);
      const items = await resolver.streams(decodeURIComponent(parts[3]));
      sendJson(res, 200, {
        items,
        warning: items.length ? null : `${parts[2]} did not return a direct playable stream for this episode.`
      });
      return;
    }

    notFound(res);
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

function openApi(req) {
  const origin = `http://${req.headers.host}`;
  return {
    openapi: "3.1.0",
    info: {
      title: "FerAnime API",
      version: VERSION
    },
    servers: [{ url: origin }],
    paths: {
      "/health": { get: { summary: "Service health" } },
      "/api/sources": { get: { summary: "List anime and manga sources" } },
      "/api/anime/search": { get: { summary: "Search anime by source" } },
      "/api/anime/catalog": { get: { summary: "Get anime catalog section" } },
      "/api/anime/{sourceId}/{animeId}": { get: { summary: "Get anime details" } },
      "/api/anime/{sourceId}/{animeId}/episodes": { get: { summary: "Get anime episodes" } },
      "/api/episodes/{sourceId}/{episodeId}/streams": { get: { summary: "Resolve episode streams" } },
      "/api/meta/show": { get: { summary: "Get show metadata" } },
      "/api/meta/episodes": { get: { summary: "Get episode metadata" } },
      "/api/manga/list": { get: { summary: "List manga" } },
      "/api/manga/search": { get: { summary: "Search manga" } },
      "/api/manga/{mangaId}": { get: { summary: "Get manga details and chapters" } },
      "/api/manga/{mangaId}/{chapterId}": { get: { summary: "Get manga chapter images" } }
    }
  };
}

function startServer() {
  return http.createServer(handle).listen(PORT, "0.0.0.0", () => {
    console.log(`FerAnime API listening on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  handle,
  startServer
};
