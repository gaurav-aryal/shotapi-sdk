import {
  ScreenshotOptions,
  ScreenshotResponse,
  ShotAPIConfig,
  ShotAPIError,
  DevicePreset,
  DevicePresetConfig,
} from './types';

export * from './types';

/**
 * ShotAPI Error class
 */
export class ShotAPIException extends Error {
  public readonly code?: string;
  public readonly details?: string;
  public readonly statusCode?: number;

  constructor(message: string, code?: string, details?: string, statusCode?: number) {
    super(message);
    this.name = 'ShotAPIException';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }
}

/**
 * Device presets with their viewport dimensions
 */
const DEVICE_PRESETS: Record<DevicePreset, DevicePresetConfig> = {
  desktop: { width: 1920, height: 1080, mobile: false, scale: 1 },
  laptop: { width: 1366, height: 768, mobile: false, scale: 1 },
  tablet: { width: 768, height: 1024, mobile: true, scale: 2 },
  mobile: { width: 375, height: 812, mobile: true, scale: 3 },
  'iphone-14': { width: 390, height: 844, mobile: true, scale: 3 },
  'iphone-14-pro': { width: 393, height: 852, mobile: true, scale: 3 },
  'iphone-14-pro-max': { width: 430, height: 932, mobile: true, scale: 3 },
  'ipad': { width: 810, height: 1080, mobile: true, scale: 2 },
  'ipad-pro': { width: 1024, height: 1366, mobile: true, scale: 2 },
  'galaxy-s23': { width: 360, height: 780, mobile: true, scale: 3 },
  'pixel-7': { width: 412, height: 915, mobile: true, scale: 2.625 },
};

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * ShotAPI - Screenshot API SDK
 *
 * @example
 * ```typescript
 * import ShotAPI from '@shotapi/sdk';
 *
 * const client = new ShotAPI({ apiKey: 'your-api-key' });
 *
 * // Basic screenshot
 * const result = await client.screenshot({ url: 'https://example.com' });
 * console.log(result.url);
 *
 * // Full page screenshot with custom options
 * const result2 = await client.screenshot({
 *   url: 'https://example.com',
 *   fullPage: true,
 *   format: 'jpeg',
 *   quality: 90,
 * });
 * ```
 */
export class ShotAPI {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retries: number;
  private readonly maxConcurrent: number;

  constructor(config: ShotAPIConfig) {
    if (!config.apiKey) {
      throw new ShotAPIException('API key is required', 'MISSING_API_KEY');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://shotapi.dev';
    this.timeout = config.timeout || 30000;
    this.retries = config.retries ?? 2;
    this.maxConcurrent = config.maxConcurrent ?? 5;
  }

  /**
   * Capture a screenshot of a URL
   *
   * @param options - Screenshot options
   * @returns Screenshot response with URL and metadata
   *
   * @example
   * ```typescript
   * const result = await client.screenshot({
   *   url: 'https://example.com',
   *   width: 1280,
   *   height: 720,
   *   fullPage: true,
   * });
   * ```
   */
  async screenshot(options: ScreenshotOptions): Promise<ScreenshotResponse> {
    // Validate URL
    if (!options.url) {
      throw new ShotAPIException('URL is required', 'MISSING_URL');
    }

    if (!isValidUrl(options.url)) {
      throw new ShotAPIException(
        `Invalid URL: ${options.url}. URL must start with http:// or https://`,
        'INVALID_URL'
      );
    }

    // Validate quality if provided
    if (options.quality !== undefined) {
      if (options.quality < 1 || options.quality > 100) {
        throw new ShotAPIException(
          'Quality must be between 1 and 100',
          'INVALID_QUALITY'
        );
      }
    }

    // Validate delay if provided
    if (options.delay !== undefined) {
      if (options.delay < 0 || options.delay > 10000) {
        throw new ShotAPIException(
          'Delay must be between 0 and 10000 milliseconds',
          'INVALID_DELAY'
        );
      }
    }

    const params = this.buildParams(options);
    return this.request<ScreenshotResponse>('/api/v1/screenshot', params);
  }

  /**
   * Capture a screenshot and return as a Buffer
   *
   * @param options - Screenshot options
   * @returns Screenshot as a Buffer
   */
  async screenshotBuffer(options: ScreenshotOptions): Promise<Buffer> {
    const response = await this.screenshot(options);
    return this.fetchBuffer(response.url);
  }

  /**
   * Capture a screenshot and save to a file
   *
   * @param options - Screenshot options
   * @param filePath - Path to save the screenshot
   */
  async screenshotToFile(options: ScreenshotOptions, filePath: string): Promise<ScreenshotResponse> {
    const response = await this.screenshot(options);
    const buffer = await this.fetchBuffer(response.url);

    // Dynamic import for Node.js fs module
    const fs = await import('fs/promises');
    const path = await import('path');

    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(filePath, buffer);

    return response;
  }

  /**
   * Capture multiple screenshots in batch with rate limiting
   *
   * @param urls - Array of URLs to capture
   * @param options - Common options for all screenshots
   * @returns Array of screenshot responses
   *
   * @example
   * ```typescript
   * const results = await client.batch([
   *   'https://example.com',
   *   'https://google.com',
   *   'https://github.com'
   * ], { width: 1280 });
   * ```
   */
  async batch(
    urls: string[],
    options?: Omit<ScreenshotOptions, 'url'>
  ): Promise<ScreenshotResponse[]> {
    const results: ScreenshotResponse[] = [];

    // Process in chunks to respect rate limits
    for (let i = 0; i < urls.length; i += this.maxConcurrent) {
      const chunk = urls.slice(i, i + this.maxConcurrent);
      const promises = chunk.map((url) =>
        this.screenshot({ ...options, url })
      );
      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);

      // Small delay between chunks to avoid rate limiting
      if (i + this.maxConcurrent < urls.length) {
        await this.sleep(100);
      }
    }

    return results;
  }

  /**
   * Get device preset dimensions
   *
   * @param device - Device preset name
   * @returns Device dimensions
   */
  static getDevicePreset(device: DevicePreset): DevicePresetConfig {
    return DEVICE_PRESETS[device];
  }

  /**
   * List all available device presets
   */
  static get devicePresets(): DevicePreset[] {
    return Object.keys(DEVICE_PRESETS) as DevicePreset[];
  }

  /**
   * Build URL parameters from options
   */
  private buildParams(options: ScreenshotOptions): URLSearchParams {
    const params = new URLSearchParams();

    params.set('url', options.url);
    params.set('api_key', this.apiKey);

    // Handle device preset
    if (options.device) {
      const preset = DEVICE_PRESETS[options.device];
      if (preset) {
        params.set('width', preset.width.toString());
        params.set('height', preset.height.toString());
        if (preset.mobile) params.set('mobile', 'true');
        if (preset.scale !== 1) params.set('scale', preset.scale.toString());
      }
    } else {
      if (options.width) params.set('width', options.width.toString());
      if (options.height) params.set('height', options.height.toString());
    }

    // Basic options
    if (options.fullPage) params.set('full_page', 'true');
    if (options.format) params.set('format', options.format);
    if (options.quality) params.set('quality', options.quality.toString());
    if (options.scale && !options.device) params.set('scale', options.scale.toString());
    if (options.delay) params.set('delay', options.delay.toString());
    if (options.waitForSelector) params.set('wait_for', options.waitForSelector);
    if (options.darkMode) params.set('dark_mode', 'true');
    if (options.mobile && !options.device) params.set('mobile', 'true');

    // Premium options
    if (options.selector) params.set('selector', options.selector);
    if (options.css) params.set('css', options.css);
    if (options.js) params.set('js', options.js);
    if (options.blockAds) params.set('block_ads', 'true');
    if (options.hideCookieBanners) params.set('hide_cookie_banners', 'true');
    if (options.thumbnailWidth) params.set('thumbnail_width', options.thumbnailWidth.toString());

    return params;
  }

  /**
   * Make an API request with retries
   */
  private async request<T>(endpoint: string, params: URLSearchParams): Promise<T> {
    const url = `${this.baseUrl}${endpoint}?${params.toString()}`;
    let lastError: ShotAPIException | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check response status before parsing JSON
        if (!response.ok) {
          let errorData: ShotAPIError | null = null;
          try {
            errorData = await response.json() as ShotAPIError;
          } catch {
            // JSON parsing failed, use generic error
          }

          const error = new ShotAPIException(
            errorData?.error || `HTTP ${response.status}: ${response.statusText}`,
            errorData?.code || 'HTTP_ERROR',
            errorData?.details,
            response.status
          );

          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw error;
          }

          lastError = error;

          // Wait before retry (exponential backoff)
          if (attempt < this.retries) {
            await this.sleep(Math.pow(2, attempt) * 1000);
          }
          continue;
        }

        const data = await response.json();
        return data as T;
      } catch (error: unknown) {
        clearTimeout(timeoutId);

        // Re-throw ShotAPIException directly
        if (error instanceof ShotAPIException) {
          throw error;
        }

        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new ShotAPIException(
            `Request timeout after ${this.timeout}ms`,
            'TIMEOUT'
          );
        } else if (error instanceof Error) {
          // Network or other error
          lastError = new ShotAPIException(
            error.message || 'Network error',
            'NETWORK_ERROR'
          );
        } else {
          lastError = new ShotAPIException('Unknown error occurred', 'UNKNOWN_ERROR');
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.retries) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new ShotAPIException('Request failed after retries', 'MAX_RETRIES');
  }

  /**
   * Fetch a URL as Buffer
   */
  private async fetchBuffer(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new ShotAPIException(
        `Failed to fetch image: HTTP ${response.status}`,
        'IMAGE_FETCH_ERROR',
        undefined,
        response.status
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Default export
export default ShotAPI;
