# Wonder Cabinet Video Automation

Automated podcast video generation for Wonder Cabinet, built with [Remotion](https://remotion.dev).

## Features

- **Automatic video generation** from audio files
- **Two output formats:**
  - Full Episodes (16:9 @ 1920×1080) for YouTube
  - Social Clips (9:16 @ 1080×1920) for TikTok/Reels/Shorts
- **Audio waveform visualization** synced to the music
- **Brand-consistent animations** with galaxy spiral and Wonder Cabinet logo
- **Watch folder automation** - drop audio, get video
- **YouTube upload integration** with OAuth 2.0
- **Batch rendering queue** for overnight processing

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Preview in Remotion Studio

```bash
npm run studio
```

This opens a browser preview where you can see all compositions and adjust props.

### 3. Render a Video

```bash
# Full episode
npx ts-node src/automation/render-trigger.ts audio.mp3 \
  --guest "Dr. Jane Doe" \
  --ep 42 \
  --title "Exploring the Unknown"

# Social clip
npx ts-node src/automation/render-trigger.ts clip.mp3 \
  --clip \
  --guest "Dr. Jane Doe" \
  --hook "This changed everything for me..."
```

---

## File Naming Convention

For automated processing, name your audio files like this:

### Full Episodes
```
EP{number}_{guest-name}_{title}.mp3
```
Example: `EP42_Dr-Jane-Doe_Journey-Into-Wonder.mp3`

### Social Clips
```
CLIP_{guest-name}_{hook-text}.mp3
```
Example: `CLIP_Dr-Jane-Doe_This-changed-everything.mp3`

### JSON Metadata (Optional)

For more control, create a JSON file alongside your audio:

```json
{
  "guestName": "Dr. Jane Doe",
  "episodeNumber": 42,
  "title": "Journey Into Wonder",
  "colorScheme": "dark",
  "waveformStyle": "mirror"
}
```

---

## Compositions

| ID | Dimensions | Use Case |
|----|------------|----------|
| `FullEpisode` | 1920×1080 (16:9) | YouTube full episodes |
| `FullEpisode-Bars` | 1920×1080 | Alt waveform style |
| `FullEpisode-Line` | 1920×1080 | Alt waveform style |
| `FullEpisode-Green` | 1920×1080 | Green color scheme |
| `SocialClip` | 1080×1920 (9:16) | TikTok/Reels/Shorts |
| `SocialClip-Mirror` | 1080×1920 | Mirror waveform |
| `SocialClip-Bars` | 1080×1920 | Bars waveform |
| `SocialClip-Green` | 1080×1920 | Green color scheme |

---

## Color Schemes

| Scheme | Primary | Waveform | Use For |
|--------|---------|----------|---------|
| `dark` | Black | Green | Standard episodes |
| `green` | Green | White | Brand-forward content |
| `warm` | Black | Pink/Red | Energetic clips |

---

## Waveform Styles

| Style | Description |
|-------|-------------|
| `mirror` | Symmetric bars above/below center (default for episodes) |
| `bars` | Single row of vertical bars |
| `circle` | Radial bars around a circle (default for clips) |
| `line` | Smooth line wave |

---

## Automation Scripts

### Watch Folder

Monitors a directory and automatically renders videos:

```bash
# Set up directories
mkdir -p input output

# Start watching
npm run watch
```

Drop files into `./input` and rendered videos appear in `./output`.

### Render Queue

For batch processing (recommended for hour-long episodes):

```bash
# Add jobs to queue
npx ts-node src/automation/render-trigger.ts audio1.mp3 --guest "Guest 1" --queue
npx ts-node src/automation/render-trigger.ts audio2.mp3 --guest "Guest 2" --queue

# Check queue status
npx ts-node src/automation/render-queue.ts status

# Process queue (run overnight)
npm run render:all

# Clear finished jobs
npx ts-node src/automation/render-queue.ts clear
```

### YouTube Upload

```bash
# Set up credentials (see .env.example)
cp .env.example .env
# Edit .env with your YouTube API credentials

# Upload with queue
npx ts-node src/automation/render-trigger.ts audio.mp3 --guest "Guest" --queue --upload

# Or upload directly
npx ts-node src/automation/youtube-upload.ts output/video.mp4 "Video Title"
```

---

## YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Desktop app** as application type
6. Copy Client ID and Client Secret to `.env`
7. First run will open browser for authorization
8. Token is saved locally for future uploads

---

## Directory Structure

```
wonder-cabinet-tools/
├── src/
│   ├── components/
│   │   ├── Background.tsx      # Animated galaxy spiral
│   │   ├── Waveform.tsx        # Audio visualization
│   │   ├── TextOverlay.tsx     # Guest name, episode info
│   │   ├── FullEpisode.tsx     # 16:9 YouTube composition
│   │   └── SocialClip.tsx      # 9:16 social composition
│   ├── automation/
│   │   ├── watch-folder.ts     # File monitoring
│   │   ├── youtube-upload.ts   # YouTube API
│   │   ├── render-queue.ts     # Batch processing
│   │   └── render-trigger.ts   # CLI interface
│   ├── brand.ts                # Colors, fonts, assets
│   ├── Root.tsx                # Composition registry
│   └── index.ts                # Entry point
├── public/                     # Static assets (logos, etc.)
├── images/                     # Source brand assets
├── input/                      # Watch folder (audio in)
├── output/                     # Rendered videos
├── remotion.config.ts
├── package.json
└── README.md
```

---

## Render Time Estimates

| Content | Duration | Render Time* |
|---------|----------|--------------|
| 1-minute clip | 60 sec | ~2-5 min |
| 30-minute episode | 30 min | ~30-60 min |
| 1-hour episode | 60 min | ~60-120 min |

*On a modern MacBook Pro. Your mileage may vary.

---

## Troubleshooting

### "ffprobe not found"

Install FFmpeg:
```bash
brew install ffmpeg
```

### "Cannot find module 'react'"

Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

### YouTube upload fails

1. Delete `.youtube-token.json`
2. Run upload again to re-authorize
3. Make sure YouTube Data API v3 is enabled

### Render runs out of memory

For very long videos, try:
```bash
NODE_OPTIONS="--max-old-space-size=8192" npm run render:all
```

---

## Support

For issues with Remotion, see [remotion.dev/docs](https://www.remotion.dev/docs).

For Wonder Cabinet specific questions, contact the production team.
