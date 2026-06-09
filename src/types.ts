/** 屏幕坐标点 */
export interface Point {
  x: number;
  y: number;
}

/** 鼠标按键类型 */
export enum MouseButton {
  Left = 'left',
  Right = 'right',
  Middle = 'middle',
}

/** 截图选项 */
export interface ScreenshotOptions {
  /** 保存目录，默认 ./screenshots */
  saveDir?: string;
  /** 文件名前缀，默认 screenshot */
  prefix?: string;
  /** 屏幕编号（多显示器时使用） */
  screen?: number;
}

/** 鼠标点击选项 */
export interface ClickOptions {
  /** 点击坐标 */
  position: Point;
  /** 鼠标按键 */
  button?: MouseButton;
  /** 双击 */
  doubleClick?: boolean;
  /** 点击前延迟（毫秒） */
  delay?: number;
}

/** 截图结果 */
export interface ScreenshotResult {
  /** 保存的文件路径 */
  filePath: string;
  /** 文件大小（字节） */
  size: number;
}
