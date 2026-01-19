/**
 * Device presets for responsive screenshots
 */
export type DevicePreset =
  | 'desktop'
  | 'laptop'
  | 'tablet'
  | 'mobile'
  | 'iphone-14'
  | 'iphone-14-pro'
  | 'iphone-14-pro-max'
  | 'ipad'
  | 'ipad-pro'
  | 'galaxy-s23'
  | 'pixel-7';

/**
 * Output format for screenshots
 */
export type ImageFormat = 'png' | 'jpeg' | 'webp' | 'pdf';

/**
 * Screenshot options
 */
export interface ScreenshotOptions {
  /**
   * Target URL to capture
   */
  url: string;

  /**
   * Viewport width in pixels (default: 1280)
   */
  width?: number;

  /**
   * Viewport height in pixels (default: 720)
   */
  height?: number;

  /**
   * Use a device preset instead of custom width/height
   */
  device?: DevicePreset;

  /**
   * Whether to capture full page (default: false)
   */
  fullPage?: boolean;

  /**
   * Output format (default: 'png')
   */
  format?: ImageFormat;

  /**
   * Image quality 1-100 (only for jpeg/webp, default: 80)
   */
  quality?: number;

  /**
   * Device scale factor (default: 1)
   */
  scale?: number;

  /**
   * Delay in milliseconds before capture (default: 0)
   */
  delay?: number;

  /**
   * Wait for a specific CSS selector to appear
   */
  waitForSelector?: string;

  /**
   * CSS selector to capture (element screenshot)
   * Premium feature
   */
  selector?: string;

  /**
   * Custom CSS to inject before capture
   * Premium feature
   */
  css?: string;

  /**
   * Custom JavaScript to execute before capture
   * Premium feature
   */
  js?: string;

  /**
   * Block ads and trackers (default: false)
   * Premium feature
   */
  blockAds?: boolean;

  /**
   * Hide cookie banners (default: false)
   * Premium feature
   */
  hideCookieBanners?: boolean;

  /**
   * Dark mode (default: false)
   */
  darkMode?: boolean;

  /**
   * Emulate mobile device (default: false)
   */
  mobile?: boolean;

  /**
   * Generate thumbnail with specified width
   * Premium feature
   */
  thumbnailWidth?: number;
}

/**
 * Screenshot response
 */
export interface ScreenshotResponse {
  /**
   * URL to the captured screenshot
   */
  url: string;

  /**
   * Thumbnail URL (if thumbnailWidth was specified)
   */
  thumbnailUrl?: string;

  /**
   * Screenshot metadata
   */
  metadata: {
    width: number;
    height: number;
    format: ImageFormat;
    size: number;
  };

  /**
   * Credits used for this request
   */
  creditsUsed: number;

  /**
   * Remaining credits
   */
  creditsRemaining: number;
}

/**
 * API Error response
 */
export interface ShotAPIError {
  error: string;
  code?: string;
  details?: string;
}

/**
 * SDK Configuration
 */
export interface ShotAPIConfig {
  /**
   * Your ShotAPI API key
   */
  apiKey: string;

  /**
   * Base URL for the API (default: https://shotapi.dev)
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds (default: 30000)
   */
  timeout?: number;

  /**
   * Number of retry attempts on failure (default: 2)
   */
  retries?: number;

  /**
   * Maximum concurrent requests for batch operations (default: 5)
   */
  maxConcurrent?: number;
}

/**
 * Device preset dimensions
 */
export interface DevicePresetConfig {
  width: number;
  height: number;
  mobile: boolean;
  scale: number;
}
