# Video Hosting Guide

Your voter guide needs video files hosted at publicly accessible URLs. Any service that serves MP4 files over HTTPS will work.

## Recommended: Cloudflare R2

[Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) is object storage with a generous free tier and no egress fees.

**Free tier:** 10 GB storage, 10 million reads/month, no bandwidth charges.

### Setup

1. Sign up for a [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
2. Go to **R2 Object Storage** in the sidebar
3. Click **Create bucket** and name it (e.g., `voter-guide-videos`)
4. In bucket settings, go to **Settings > Public access** and enable it
   - This gives you a public URL like `https://pub-abc123.r2.dev`

### Upload Videos

1. Open your bucket in the Cloudflare dashboard
2. Click **Upload** and drag your video files in
3. Videos will be accessible at `https://pub-abc123.r2.dev/your-video.mp4`

### Configure Your Guide

Set `videoBaseUrl` in `site.config.ts`:

```typescript
videoBaseUrl: 'https://pub-abc123.r2.dev',
```

In your Google Sheet's `clips` tab, set `video_src` for each clip to the full URL:

```
https://pub-abc123.r2.dev/intro_jane-doe.mp4
```

### Custom Domain (Optional)

In your R2 bucket settings, you can connect a custom domain (e.g., `videos.yourorg.com`) for cleaner URLs.

## Alternative: Backblaze B2 + Cloudflare CDN

[Backblaze B2](https://www.backblaze.com/cloud-storage) offers 10 GB free storage. Paired with Cloudflare's CDN (free), egress is also free via the [Bandwidth Alliance](https://www.cloudflare.com/bandwidth-alliance/).

Setup is more involved — see Backblaze's [integration guide](https://www.backblaze.com/docs/cloud-storage-deliver-public-backblaze-b2-content-through-cloudflare-cdn).

## Alternative: Any Web Server

If you already have a web server or CDN, just upload your MP4 files to a public directory and use those URLs. The only requirement is that files are served over HTTPS.

## Video Format Recommendations

| Setting | Recommendation |
|---------|----------------|
| **Format** | MP4 (H.264 video, AAC audio) |
| **Orientation** | Vertical (9:16 aspect ratio) |
| **Resolution** | 1080 x 1920 |
| **File size** | 10-30 MB per 1-2 minute clip |

### Compressing with FFmpeg

[FFmpeg](https://ffmpeg.org/) is a free command-line tool for video processing. Here are some useful recipes:

**Compress a video to target ~15 MB for a 90-second clip:**

```bash
ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -preset slow -vf "scale=1080:1920" -acodec aac -b:a 128k output.mp4
```

**Batch-compress all MP4 files in a folder:**

```bash
for f in raw/*.mp4; do
  ffmpeg -i "$f" -vcodec libx264 -crf 28 -preset slow -vf "scale=1080:1920" -acodec aac -b:a 128k "compressed/$(basename "$f")"
done
```

**Extract a poster image (first frame):**

```bash
ffmpeg -i input.mp4 -vframes 1 -q:v 2 poster.jpg
```

**Key flags:**
- `-crf 28`: Quality level (lower = higher quality, larger file; 23-30 is good for web)
- `-preset slow`: Better compression (use `medium` for faster encoding)
- `-vf "scale=1080:1920"`: Force 1080x1920 vertical resolution

### Tips

- **Vertical video is key.** The player is designed for 9:16 portrait video. Horizontal video will work but won't fill the player.
- **Keep clips short.** 1-2 minutes per question keeps viewers engaged and file sizes manageable.
- **Use consistent naming.** A convention like `{question-slug}_{candidate-slug}.mp4` makes organizing easy. Example: `housing_jane-doe.mp4`
- **Add captions.** Create `.vtt` subtitle files and host them alongside your videos. Set the `captions_vtt_src` field in your clips data.
- **Include poster images.** A poster frame (first frame or a branded thumbnail) shows while the video loads. Set `poster_src` in your clips data.
