# FerAnime API Service

FerAnime API Service is a standalone Node JSON API for apps and websites that need anime source lookup, episode discovery, stream resolution, metadata helpers, and MangaKatana manga reader data.

It is split out from the FerAnime native iOS project so other clients can use the backend without pulling in the mobile app.

## Features

- Anime search across AniZone, AnimeHeaven, HiAnime, and AnimeKai.
- Anime catalog sections where supported by a source.
- Anime details and episode lists.
- HLS/MP4 stream resolution when a source exposes direct streams.
- Embed fallback URLs when direct streams are not available.
- Jikan-based show metadata helpers.
- MangaKatana manga list, search, detail, chapter list, and page images.
- CORS enabled for app and website clients.
- No database required.
- Ready for Render, Railway, Heroku, and Vercel.

## Quick Start

```bash
npm install
npm start
```

The service runs on:

```text
http://localhost:4517
```

Use `PORT` to change the port:

```bash
PORT=3000 npm start
```

## Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
[![Deploy on Railway](https://img.shields.io/badge/Deploy%20on-Railway-7B61FF?style=for-the-badge&logo=railway&logoColor=white)](https://railway.com/new)

Default start command:

```text
npm start
```

Health check:

```text
/health
```

## Endpoints

### Service

```http
GET /
GET /docs
GET /openapi.json
GET /health
GET /api/sources
```

### Anime

```http
GET /api/anime/search?sourceId=anizone&q=naruto&page=1
GET /api/anime/catalog?sourceId=anizone&section=trending
GET /api/anime/:sourceId/:animeId
GET /api/anime/:sourceId/:animeId/episodes
GET /api/episodes/:sourceId/:episodeId/streams
```

Available anime source IDs:

```text
anizone
animeheaven
hianime
animekai
```

### Metadata

```http
GET /api/meta/show?title=naruto
GET /api/meta/episodes?title=naruto&malId=20
```

### Manga

```http
GET /api/manga/list?type=latest&page=1
GET /api/manga/search?q=naruto&page=1
GET /api/manga/:mangaId
GET /api/manga/:mangaId/:chapterId
```

Compatibility aliases:

```http
GET /api/mangaList?type=latest&page=1
GET /api/search/:query?page=1
```

## Example

```bash
curl "http://localhost:4517/api/anime/search?sourceId=anizone&q=naruto"
curl "http://localhost:4517/api/manga/search?q=naruto"
```

## Notes

- This service scrapes public pages and source behavior can change at any time.
- Some sources may block datacenter IPs or return embeds instead of direct streams.
- Free hosting tiers may sleep after inactivity.
- Use responsibly and only with content you have permission to access.

## Credits

Thanks to the open-source anime tooling ecosystem and the public metadata/source sites that informed this API service:

- Jikan
- MangaKatana
- AniZone
- AnimeHeaven
- HiAnime
- AnimeKai
- ani-cli, animdl, anipy-cli, mov-cli, ShonenX, and related source-research projects

## License

MIT
