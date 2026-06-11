import path from 'path';
import fs from 'fs';
import screenshot from 'screenshot-desktop';
import robot from '@jitsi/robotjs';
import { click } from '../src';
import { MouseButton } from '../src/types';
import { MimoClient } from './mimo';

// ==================== MiMo API 配置（请自行填入） ====================
const MIMO_API_KEY = 'sk-cjssavtnu42vznyxm9we1xfry11pp4ud8e2x4mpzpujcxqff'; // TODO: 填入你的 MiMo API Key
const mimoClient = new MimoClient({
  apiKey: MIMO_API_KEY,
  // baseURL: 'https://api.xiaomimimo.com/v1', // 默认，可不填
  // model: 'mimo-v2-omni', // 默认，可不填
});

// 截屏位置
const screenshotDir = path.resolve(__dirname, 'screenshot');

// 浏览器聚焦左下角，右下角
const browserFocus: any[] = [
  [1300, 2092],
  [1350, 2175],
];

// 图片生成按钮 左下角，右下角
const imageButton: any[] = [
  [2199, 1934],
  [2343, 1957],
];

// 输入框 左上角，右上角
const inputBoxText: string = 'NASA星空图片';
// const inputBox: any[] = [
//     [1295,1856],
//     [2329,1904]
// ];

// 发送按钮 左下角，右下角
const sendButton: any[] = [
  [2798, 1928],
  [2830, 1958],
];

/**
 *  根据点位获取内随机一个位置。
 */
function getRandomPoint(p1: [number, number], p2: [number, number]) {
  const [x1, y1] = p1;
  const [x2, y2] = p2;

  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
  const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

  return { x, y };
}

/**
 * screenshotX/Y：你从截图里拿到的坐标（物理像素）
 * screenshotWidth/Height：截图原始尺寸（必须知道）
 */
function moveMouseFromScreenshot(
  screenshotX: number,
  screenshotY: number,
  screenshotWidth: number,
  screenshotHeight: number,
) {
  const screen = robot.getScreenSize();

  // 自动计算缩放比例（Retina / DPI）
  const scaleX = screenshotWidth / screen.width;
  const scaleY = screenshotHeight / screen.height;

  const x = Math.round(screenshotX / scaleX);
  const y = Math.round(screenshotY / scaleY);

  return { x, y };
}

/**
 * 截屏并保存到指定目录（使用 buffer 模式，避免 screencapture 路径问题）
 */
async function saveScreenshot(saveDir: string, prefix: string) {
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${prefix}_${timestamp}.png`;
  const filePath = path.resolve(saveDir, filename);

  const imgBuffer = await screenshot({ format: 'png' });
  fs.writeFileSync(filePath, imgBuffer);

  const stats = fs.statSync(filePath);
  const { width, height } = readPngSize(imgBuffer);
  return { imgBuffer, filePath, size: stats.size, width, height };
}

/**
 * 从 PNG buffer 读取宽高（PNG 头部第 16-23 字节为大端序 width/height）
 */
function readPngSize(buffer: Buffer): { width: number; height: number } {
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

async function main() {
  // 截屏当前屏幕
  console.log('正在截屏...');
  const result = await saveScreenshot(screenshotDir, 'screen');
  console.log(`截屏已保存: ${result.filePath} (${(result.size / 1024).toFixed(1)}KB)`);

  // ai 识别获取
  const screenPointsResult = await findButtonPositions(
    result.imgBuffer,
    result.width,
    result.height,
    ['发送按钮', '图片生成按钮'],
  );

  console.log('screenPointsResult', screenPointsResult);

  // 浏览器聚焦
  const browserFocusPoint = getRandomPoint(browserFocus[0], browserFocus[1]);
  click({
    position: moveMouseFromScreenshot(
      browserFocusPoint.x,
      browserFocusPoint.y,
      result.width,
      result.height,
    ),
    button: MouseButton.Left,
    delay: 100,
    doubleClick: true,
  });

  // 移动鼠标到图片按钮
  const imageButtonPoint = getRandomPoint(imageButton[0], imageButton[1]);
  click({
    position: moveMouseFromScreenshot(
      imageButtonPoint.x,
      imageButtonPoint.y,
      result.width,
      result.height,
    ),
    button: MouseButton.Left,
    delay: 100,
    doubleClick: true,
  });
  console.log('已选择图片');

  // 等待聚焦后输入文案
  await sleep(300);
  robot.typeString(inputBoxText);
  console.log('输入完成!');
  await sleep(300);

  const sendButtonPoint = getRandomPoint(sendButton[0], sendButton[1]);
  click({
    position: moveMouseFromScreenshot(
      sendButtonPoint.x,
      sendButtonPoint.y,
      result.width,
      result.height,
    ),
    button: MouseButton.Left,
    delay: 100,
    doubleClick: true,
  });
}

/**
 * 使用 MiMo API 在截图中识别多个按钮/元素的位置，并转换为屏幕坐标
 * @param screenshotBuffer 截图的 PNG Buffer
 * @param screenshotWidth 截图原始宽度
 * @param screenshotHeight 截图原始高度
 * @param buttonDescriptions 按钮描述数组，例如：["发送按钮", "图片生成按钮"]
 * @returns 屏幕绝对坐标数组，顺序与传入的描述严格一致
 */
async function findButtonPositions(
  screenshotBuffer: Buffer,
  screenshotWidth: number,
  screenshotHeight: number,
  buttonDescriptions: string[],
): Promise<{ x: number; y: number }[]> {
  if (!MIMO_API_KEY) {
    throw new Error('请先配置 MIMO_API_KEY');
  }

  if (buttonDescriptions.length === 0) {
    return [];
  }

  // 1. 调用 MiMo 批量识别图片内坐标
  const points = await mimoClient.locateElements(screenshotBuffer, buttonDescriptions);

  // 2. 将截图内坐标批量转换为屏幕绝对坐标
  const screenPoints = points.map((point, i) => {
    const screenPoint = moveMouseFromScreenshot(
      point.x,
      point.y,
      screenshotWidth,
      screenshotHeight,
    );
    console.log(
      `MiMo 识别到 "${buttonDescriptions[i]}" 在图片内坐标: (${point.x}, ${point.y})，屏幕坐标: (${screenPoint.x}, ${screenPoint.y})`,
    );
    return screenPoint;
  });

  return screenPoints;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error('执行出错:', err);
  process.exit(1);
});
