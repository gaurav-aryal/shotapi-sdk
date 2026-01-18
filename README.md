# ShotAPI SDK

Official Node.js SDK for [ShotAPI](https://shotapi.dev) - Screenshot API for Developers.

## Installation

```bash
npm install shotapi
```

## Quick Start

```typescript
import ShotAPI from 'shotapi';

const client = new ShotAPI({ apiKey: 'your-api-key' });

// Capture a screenshot
const result = await client.screenshot({
  url: 'https://example.com'
});

console.log(result.url); // URL to the screenshot
```

## Features

- Full TypeScript support
- Automatic retries with exponential backoff
- Device presets (iPhone, iPad, Android, etc.)
- Batch screenshot capture
- Save directly to file
- Get screenshot as Buffer

## Usage Examples

### Basic Screenshot

```typescript
const result = await client.screenshot({
  url: 'https://example.com',
  width: 1280,
  height: 720
});
```

### Full Page Screenshot

```typescript
const result = await client.screenshot({
  url: 'https://example.com',
  fullPage: true
});
```

### Device Preset

```typescript
// Use iPhone 14 Pro dimensions
const result = await client.screenshot({
  url: 'https://example.com',
  device: 'iphone-14-pro'
});

// Available presets:
// desktop, laptop, tablet, mobile,
// iphone-14, iphone-14-pro, iphone-14-pro-max,
// ipad, ipad-pro, galaxy-s23, pixel-7
```

### Different Formats

```typescript
// JPEG with quality
const jpeg = await client.screenshot({
  url: 'https://example.com',
  format: 'jpeg',
  quality: 90
});

// WebP
const webp = await client.screenshot({
  url: 'https://example.com',
  format: 'webp',
  quality: 85
});

// PDF
const pdf = await client.screenshot({
  url: 'https://example.com',
  format: 'pdf',
  fullPage: true
});
```

### Wait for Content

```typescript
// Wait for a specific element
const result = await client.screenshot({
  url: 'https://example.com',
  waitForSelector: '.main-content'
});

// Add delay before capture
const result2 = await client.screenshot({
  url: 'https://example.com',
  delay: 2000 // 2 seconds
});
```

### Premium Features

```typescript
// Element screenshot
const element = await client.screenshot({
  url: 'https://example.com',
  selector: '#hero-section'
});

// Inject custom CSS
const styled = await client.screenshot({
  url: 'https://example.com',
  css: 'body { background: #f0f0f0; }'
});

// Execute JavaScript before capture
const dynamic = await client.screenshot({
  url: 'https://example.com',
  js: 'document.querySelector(".popup").remove();'
});

// Block ads
const clean = await client.screenshot({
  url: 'https://example.com',
  blockAds: true,
  hideCookieBanners: true
});

// Generate thumbnail
const thumb = await client.screenshot({
  url: 'https://example.com',
  thumbnailWidth: 300
});
```

### Save to File

```typescript
await client.screenshotToFile(
  { url: 'https://example.com' },
  './screenshot.png'
);
```

### Get as Buffer

```typescript
const buffer = await client.screenshotBuffer({
  url: 'https://example.com'
});

// Use buffer (e.g., upload to S3, send in response, etc.)
```

### Batch Screenshots

```typescript
const urls = [
  'https://example.com',
  'https://google.com',
  'https://github.com'
];

const results = await client.batch(urls, {
  width: 1280,
  height: 720
});
```

## Configuration

```typescript
const client = new ShotAPI({
  apiKey: 'your-api-key',      // Required
  baseUrl: 'https://shotapi.dev', // Optional (default)
  timeout: 30000,              // Request timeout in ms (default: 30000)
  retries: 2                   // Retry attempts (default: 2)
});
```

## Error Handling

```typescript
import ShotAPI, { ShotAPIException } from 'shotapi';

try {
  const result = await client.screenshot({
    url: 'https://example.com'
  });
} catch (error) {
  if (error instanceof ShotAPIException) {
    console.error('API Error:', error.message);
    console.error('Error Code:', error.code);
    console.error('Status Code:', error.statusCode);
  }
}
```

## TypeScript

The SDK is written in TypeScript and includes full type definitions:

```typescript
import ShotAPI, {
  ScreenshotOptions,
  ScreenshotResponse,
  DevicePreset,
  ImageFormat,
  ShotAPIConfig
} from 'shotapi';
```

## Response Format

```typescript
interface ScreenshotResponse {
  url: string;           // URL to the screenshot
  thumbnailUrl?: string; // Thumbnail URL (if requested)
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;        // File size in bytes
  };
  creditsUsed: number;
  creditsRemaining: number;
}
```

## Device Presets

| Preset | Width | Height | Mobile | Scale |
|--------|-------|--------|--------|-------|
| desktop | 1920 | 1080 | No | 1 |
| laptop | 1366 | 768 | No | 1 |
| tablet | 768 | 1024 | Yes | 2 |
| mobile | 375 | 812 | Yes | 3 |
| iphone-14 | 390 | 844 | Yes | 3 |
| iphone-14-pro | 393 | 852 | Yes | 3 |
| iphone-14-pro-max | 430 | 932 | Yes | 3 |
| ipad | 810 | 1080 | Yes | 2 |
| ipad-pro | 1024 | 1366 | Yes | 2 |
| galaxy-s23 | 360 | 780 | Yes | 3 |
| pixel-7 | 412 | 915 | Yes | 2.625 |

## License

MIT

## Links

- [Website](https://shotapi.dev)
- [Documentation](https://shotapi.dev/docs)
- [API Reference](https://shotapi.dev/docs/api)
