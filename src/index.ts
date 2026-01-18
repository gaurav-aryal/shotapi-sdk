import {
  ScreenshotOptions,
  ScreenshotResponse,
  ShotAPIConfig,
  ShotAPIError,
  DevicePreset,
  ImageFormat,
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
const DEVICE_PRESETS: Record<DevicePreset, { width: number; height: number; mobile: boolean; scale: number }> = {
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
 * ShotAPI - Screenshot API SDK
 *
 * @example
 * ```typescript
 * import ShotAPI from 'shotapi';
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

  constructor(config: ShotAPIConfig) {
    if (!config.apiKey) {
      throw new ShotAPIException('API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://shotapi.dev';
    this.timeout = config.timeout || 30000;
    this.retries = config.retries ?? 2;
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
    if (!options.url) {
      throw new ShotAPIException('URL is required');
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
    const imageResponse = await fetch(response.url);

    if (!imageResponse.ok) {
      throw new ShotAPIException('Failed to fetch screenshot image');
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
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
    await fs.writeFile(filePath, buffer);

    return response;
  }

  /**
   * Capture multiple screenshots in batch
   *
   * @param urls - Array of URLs to capture
   * @param options - Common options for all screenshots
   * @returns Array of screenshot responses
   */
  async batch(
    urls: string[],
    options?: Omit<ScreenshotOptions, 'url'>
  ): Promise<ScreenshotResponse[]> {
    const promises = urls.map((url) =>
      this.screenshot({ ...options, url })
    );
    return Promise.all(promises);
  }

  /**
   * Get device preset dimensions
   *
   * @param device - Device preset name
   * @returns Device dimensions
   */
  static getDevicePreset(device: DevicePreset) {
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
    if (options.scale) params.set('scale', options.scale.toString());
    if (options.delay) params.set('delay', options.delay.toString());
    if (options.waitForSelector) params.set('wait_for', options.waitForSelector);
    if (options.darkMode) params.set('dark_mode', 'true');
    if (options.mobile) params.set('mobile', 'true');

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
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          const error = data as ShotAPIError;
          throw new ShotAPIException(
            error.error || 'Unknown error',
            error.code,
            error.details,
            response.status
          );
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof ShotAPIException && error.statusCode && error.statusCode < 500) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.retries) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new ShotAPIException('Request failed after retries');
  }

  /**
   * Fetch a URL as Buffer
   */
  private async fetchBuffer(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new ShotAPIException('Failed to fetch image');
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
