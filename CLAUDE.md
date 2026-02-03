# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wonder Cabinet Video Automation — a Remotion 4.0 (React-based programmatic video) system that generates podcast videos from audio files. Two output formats: full YouTube episodes (16:9) and vertical social clips (9:16). Includes watch-folder automation, batch render queue, and YouTube upload integration.

## Commands

```bash
npm run studio          # Open Remotion Studio preview (browser UI at localhost:3000)
npm run build           # Render default FullEpisode to out/episode.mp4
npm run render:episode  # Render full episode (pass composition props via --props)
npm run render:clip     # Render social clip
npm run render:all      # Process render queue (runs dist/automation/render-trigger.js)
npm run watch           # Monitor ./input for new audio files, auto-render
npm run upload          # YouTube upload script
npm run typecheck       # Type check with tsc --noEmit (no test framework configured)
```

Rendering a specific composition with props:
```bash
npx remotion render FullEpisode out/video.mp4 --props='{"audioSrc": "path/to/audio.mp3", "guestName": "Name"}'
```

Automation CLI:
```bash
npx ts-node src/automation/render-trigger.ts audio.mp3 --guest "Name" --ep 42 --title "Title"
npx ts-node src/automation/render-trigger.ts clip.mp3 --clip --guest "Name" --hook "Hook text"
```

## Architecture

### Composition System

`Root.tsx` is the central registry. It defines 9 Remotion `<Composition>` entries, each with a Zod schema for prop validation. All compositions run at 30fps.

| Composition ID | Component | Dimensions | Default Waveform |
|---|---|---|---|
| `FullEpisode` | FullEpisode | 1920x1080 | mirror |
| `FullEpisode-Bars/Line/Green` | FullEpisode | 1920x1080 | bars/line/mirror |
| `SocialClip` | SocialClip | 1080x1920 | circle |
| `SocialClip-Mirror/Bars/Green` | SocialClip | 1080x1920 | varies |
| `OriginalTemplate` | OriginalTemplate | 1920x1080 | n/a |

### Component Layering

Both `FullEpisode` and `SocialClip` use a 4-layer stack (bottom to top):
1. **Background** — animated galaxy spiral with particles, radial gradient overlay, vignette
2. **TextOverlay** — episode metadata with staggered fade/slide-in animations (0-35 frame delays)
3. **Waveform** — audio visualization (bars, mirror, circle, or line styles)
4. **`<Audio>`** — Remotion audio element

Components detect aspect ratio (`height > width`) to adapt layout for vertical vs horizontal.

### Brand System

`brand.ts` exports centralized constants (`brand` and `colorSchemes`). Three color schemes:
- **dark** — black bg, green waveform (default)
- **green** — green bg, white waveform
- **warm** — black bg, pink/red waveform

Color scheme names are used as Zod enum values in composition props and as keys in `colorSchemes`.

### Automation Pipeline

`src/automation/` contains four modules that form a pipeline:

1. **watch-folder.ts** — chokidar watches `./input`, parses filenames (`EP{n}_{guest}_{title}.mp3` or `CLIP_{guest}_{hook}.mp3`), loads optional JSON sidecars, spawns renders
2. **render-trigger.ts** — CLI orchestrator, gets audio duration via ffprobe, calls `remotion render` with props
3. **render-queue.ts** — persistent JSON-file queue (`.render-queue.json`), concurrent render limiting, job status tracking (pending/rendering/uploading/completed/failed)
4. **youtube-upload.ts** — OAuth2 flow via googleapis, tokens saved to `.youtube-token.json`

### Key Patterns

- **Zod schemas** validate all composition props at runtime (defined in `Root.tsx`)
- **`staticFile()`** references assets in `src/public/` — Remotion resolves these at render time
- **Animation** uses `useCurrentFrame()` + `interpolate()` with `Easing.out(Easing.cubic)` throughout
- **Audio visualization** via `useAudioData()` from `@remotion/media-utils`, with animated sine-wave fallback when audio is missing
- **No test framework** is configured — `typecheck` is the primary validation command

## Environment Setup

Requires FFmpeg on the system (`brew install ffmpeg`). Copy `.env.example` to `.env` for YouTube API credentials (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI) and directory paths.

## TypeScript

Strict mode enabled. Target ES2022, module ESNext with bundler resolution. `noEmit: true` (type-check only — Remotion handles bundling). JSX mode is `react-jsx` (automatic transform).
