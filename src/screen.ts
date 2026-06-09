import screenshot from 'screenshot-desktop';
import fs from 'fs';
import path from 'path';
import { ScreenshotOptions, ScreenshotResult } from './types';

const DEFAULT_SAVE_DIR = './screenshots';
const DEFAULT_PREFIX = 'screenshot';

/**
 * 确保目录存在
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 生成带时间戳的文件名
 */
function generateFilename(prefix: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  return `${prefix}_${timestamp}.png`;
}

/**
 * 截取当前屏幕并保存为图片文件
 */
export async function captureScreen(options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
  const { saveDir = DEFAULT_SAVE_DIR, prefix = DEFAULT_PREFIX, screen } = options;

  ensureDir(saveDir);

  const filename = generateFilename(prefix);
  const filePath = path.resolve(saveDir, filename);

  const screenshotOpts: screenshot.ScreenshotOptionsWithFilename = { filename: filePath };
  if (screen !== undefined) {
    screenshotOpts.screen = screen;
  }

  await screenshot(screenshotOpts);

  const stats = fs.statSync(filePath);

  return {
    filePath,
    size: stats.size,
  };
}

/**
 * 获取所有可用屏幕列表
 */
export async function listScreens(): Promise<screenshot.Display[]> {
  return screenshot.listDisplays();
}
