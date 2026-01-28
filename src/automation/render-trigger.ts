/**
 * Render Trigger - Main Orchestration Script
 *
 * Provides a simple interface to render videos from audio files.
 * Can be used standalone or integrated with the watch folder system.
 *
 * Usage:
 *   npx ts-node render-trigger.ts <audio-file> [options]
 *
 * Options:
 *   --episode       Render as full episode (16:9)
 *   --clip          Render as social clip (9:16)
 *   --guest <name>  Guest name
 *   --ep <number>   Episode number
 *   --title <text>  Episode title
 *   --hook <text>   Hook text for clips
 *   --upload        Upload to YouTube after render
 *   --queue         Add to queue instead of rendering immediately
 */

import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { addJob, processQueue } from "./render-queue";
import "dotenv/config";

const OUTPUT_DIR = process.env.OUTPUT_DIR || "./output";

interface RenderOptions {
  audioPath: string;
  type: "episode" | "clip";
  guestName: string;
  episodeNumber?: number;
  episodeTitle?: string;
  hookText?: string;
  colorScheme?: "dark" | "green" | "warm";
  waveformStyle?: "mirror" | "bars" | "circle" | "line";
  uploadToYouTube?: boolean;
  addToQueue?: boolean;
}

/**
 * Get audio duration using ffprobe
 */
async function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      audioPath,
    ]);

    let output = "";
    ffprobe.stdout.on("data", (data) => {
      output += data.toString();
    });

    ffprobe.on("close", (code) => {
      if (code === 0) {
        resolve(parseFloat(output.trim()));
      } else {
        reject(new Error(`ffprobe exited with code ${code}`));
      }
    });

    ffprobe.on("error", reject);
  });
}

/**
 * Render video directly (not using queue)
 */
async function renderDirect(
  options: RenderOptions,
  durationSeconds: number
): Promise<string> {
  const fps = 30;
  const durationInFrames = Math.ceil(durationSeconds * fps);

  const composition = options.type === "episode" ? "FullEpisode" : "SocialClip";
  const timestamp = new Date().toISOString().slice(0, 10);
  const safeName = options.guestName.replace(/[^a-zA-Z0-9]/g, "-");

  let outputFilename: string;
  if (options.type === "episode" && options.episodeNumber) {
    outputFilename = `EP${options.episodeNumber}_${safeName}_${timestamp}.mp4`;
  } else if (options.type === "episode") {
    outputFilename = `Episode_${safeName}_${timestamp}.mp4`;
  } else {
    outputFilename = `Clip_${safeName}_${timestamp}.mp4`;
  }

  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Build props
  const props: Record<string, unknown> = {
    audioSrc: path.resolve(options.audioPath),
    guestName: options.guestName,
  };

  if (options.episodeNumber) props.episodeNumber = options.episodeNumber;
  if (options.episodeTitle) props.episodeTitle = options.episodeTitle;
  if (options.hookText) props.hookText = options.hookText;
  if (options.colorScheme) props.colorScheme = options.colorScheme;
  if (options.waveformStyle) props.waveformStyle = options.waveformStyle;

  console.log("\n" + "═".repeat(60));
  console.log("Wonder Cabinet Video Render");
  console.log("═".repeat(60));
  console.log(`Composition: ${composition}`);
  console.log(`Audio: ${options.audioPath}`);
  console.log(`Duration: ${Math.floor(durationSeconds / 60)}m ${Math.floor(durationSeconds % 60)}s`);
  console.log(`Output: ${outputPath}`);
  console.log("═".repeat(60));

  return new Promise((resolve, reject) => {
    const args = [
      "remotion",
      "render",
      composition,
      outputPath,
      `--props=${JSON.stringify(props)}`,
      `--frames=0-${durationInFrames - 1}`,
    ];

    const render = spawn("npx", args, {
      stdio: "inherit",
      shell: true,
    });

    render.on("close", (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`Render failed with code ${code}`));
      }
    });

    render.on("error", reject);
  });
}

/**
 * Parse command line arguments
 */
function parseArgs(): RenderOptions {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
Wonder Cabinet Video Render

Usage:
  npx ts-node render-trigger.ts <audio-file> [options]

Options:
  --episode         Render as full episode (16:9) [default]
  --clip            Render as social clip (9:16)
  --guest <name>    Guest name [required]
  --ep <number>     Episode number
  --title <text>    Episode title
  --hook <text>     Hook text (for clips)
  --scheme <name>   Color scheme: dark, green, warm [default: dark]
  --waveform <type> Waveform style: mirror, bars, circle, line
  --upload          Upload to YouTube after render
  --queue           Add to queue instead of immediate render

Examples:
  npx ts-node render-trigger.ts audio.mp3 --guest "Jane Doe" --ep 42 --title "The Big Idea"
  npx ts-node render-trigger.ts clip.mp3 --clip --guest "Jane Doe" --hook "This changed everything"
  npx ts-node render-trigger.ts audio.mp3 --guest "Jane Doe" --queue --upload
`);
    process.exit(0);
  }

  const audioPath = args[0];

  if (!fs.existsSync(audioPath)) {
    console.error(`Error: Audio file not found: ${audioPath}`);
    process.exit(1);
  }

  const options: RenderOptions = {
    audioPath,
    type: "episode",
    guestName: "Guest",
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--episode":
        options.type = "episode";
        break;
      case "--clip":
        options.type = "clip";
        break;
      case "--guest":
        options.guestName = args[++i];
        break;
      case "--ep":
        options.episodeNumber = parseInt(args[++i], 10);
        break;
      case "--title":
        options.episodeTitle = args[++i];
        break;
      case "--hook":
        options.hookText = args[++i];
        break;
      case "--scheme":
        options.colorScheme = args[++i] as "dark" | "green" | "warm";
        break;
      case "--waveform":
        options.waveformStyle = args[++i] as "mirror" | "bars" | "circle" | "line";
        break;
      case "--upload":
        options.uploadToYouTube = true;
        break;
      case "--queue":
        options.addToQueue = true;
        break;
    }
  }

  return options;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const options = parseArgs();

  try {
    // Get audio duration
    console.log("Analyzing audio...");
    const duration = await getAudioDuration(options.audioPath);
    console.log(`Duration: ${duration.toFixed(2)} seconds`);

    // Build props object
    const props: Record<string, unknown> = {
      guestName: options.guestName,
    };

    if (options.episodeNumber) props.episodeNumber = options.episodeNumber;
    if (options.episodeTitle) props.episodeTitle = options.episodeTitle;
    if (options.hookText) props.hookText = options.hookText;
    if (options.colorScheme) props.colorScheme = options.colorScheme;
    if (options.waveformStyle) props.waveformStyle = options.waveformStyle;

    if (options.addToQueue) {
      // Add to queue for later processing
      const job = addJob({
        audioPath: options.audioPath,
        composition: options.type === "episode" ? "FullEpisode" : "SocialClip",
        props,
        durationSeconds: duration,
        uploadToYouTube: options.uploadToYouTube,
      });

      console.log(`\n✓ Job added to queue: ${job.id}`);
      console.log("Run 'npm run render:all' to process the queue.");
    } else {
      // Render immediately
      const outputPath = await renderDirect(options, duration);
      console.log(`\n✓ Render complete: ${outputPath}`);

      // Upload if requested
      if (options.uploadToYouTube) {
        console.log("\nUpload to YouTube requested but not implemented in direct mode.");
        console.log("Use --queue flag for YouTube upload support.");
      }
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run if executed directly
main();
