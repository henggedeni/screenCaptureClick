import robot from '@jitsi/robotjs';
import { ClickOptions, MouseButton } from './types';

const DEFAULT_DELAY = 100;

/**
 * 执行鼠标点击
 */
export async function click(options: ClickOptions) {
  const {
    position,
    button = MouseButton.Left,
    doubleClick = false,
    delay = DEFAULT_DELAY,
  } = options;

  // 移动鼠标到指定位置
  // robot.moveMouse(position.x, position.y);// mac 无法使用
  robot.moveMouseSmooth(position.x, position.y);

  // 点击前等待
  robot.setMouseDelay(delay);

  // 执行点击
  if (doubleClick) {
    robot.mouseClick(mapButton(button), true);
  } else {
    robot.mouseClick(mapButton(button));
  }
}

/**
 * 移动鼠标到指定位置（不点击）
 */
export function moveMouse(x: number, y: number): void {
  robot.moveMouse(x, y);
}

/**
 * 获取当前鼠标位置
 */
export function getMousePos(): { x: number; y: number } {
  return robot.getMousePos();
}

/**
 * 滚动鼠标滚轮
 */
export function scrollMouse(amount: number, direction: 'up' | 'down' = 'down'): void {
  const scrollAmount = direction === 'up' ? -amount : amount;
  robot.scrollMouse(0, scrollAmount);
}

/**
 * 映射 MouseButton 枚举到 robotjs 按键类型
 */
function mapButton(button: MouseButton): string {
  switch (button) {
    case MouseButton.Left:
      return 'left';
    case MouseButton.Right:
      return 'right';
    case MouseButton.Middle:
      return 'middle';
    default:
      return 'left';
  }
}
