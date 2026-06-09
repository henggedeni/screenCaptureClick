# Screen Capture & Click

Node.js (TypeScript) 屏幕截图 & 鼠标点击工具。支持截取当前屏幕图片、鼠标在指定位置点击。

## 功能

- 截取当前屏幕并保存为 PNG 图片
- 在指定坐标位置执行鼠标点击（左键/右键/中键）
- 支持双击
- 获取当前鼠标位置
- 移动鼠标到指定位置
- 多显示器支持
- CLI 命令行工具 + 编程 API

## 安装

```bash
npm install
```

### macOS 额外依赖

macOS 需要授予辅助功能权限：

1. 系统偏好设置 → 安全性与隐私 → 隐私 → 辅助功能
2. 将终端 (Terminal) 或 iTerm 添加到允许列表

截图功能需要授予屏幕录制权限：

1. 系统偏好设置 → 安全性与隐私 → 隐私 → 屏幕录制
2. 将终端添加到允许列表

## 使用

### CLI 命令行

```bash
# 截取屏幕
npx ts-node src/cli.ts screenshot

# 指定保存目录和文件名前缀
npx ts-node src/cli.ts screenshot -d ./my-shots -p demo

# 在指定位置点击鼠标
npx ts-node src/cli.ts click -x 500 -y 300

# 右键点击
npx ts-node src/cli.ts click -x 500 -y 300 -b right

# 双击
npx ts-node src/cli.ts click -x 500 -y 300 --double

# 获取当前鼠标位置
npx ts-node src/cli.ts mousepos

# 移动鼠标
npx ts-node src/cli.ts move -x 500 -y 300

# 列出可用屏幕
npx ts-node src/cli.ts screens

# 先截图再点击
npx ts-node src/cli.ts capture-and-click -x 500 -y 300
```

### 编程 API

```typescript
import { captureScreen, click, MouseButton, getMousePos } from './src';

// 截图
const result = await captureScreen({ saveDir: './screenshots', prefix: 'demo' });
console.log(`截图保存: ${result.filePath}`);

// 鼠标点击
click({
  position: { x: 500, y: 300 },
  button: MouseButton.Left,
  delay: 200,
});

// 双击
click({
  position: { x: 500, y: 300 },
  doubleClick: true,
});

// 获取当前鼠标位置
const pos = getMousePos();
console.log(`鼠标位置: (${pos.x}, ${pos.y})`);
```

## 项目结构

```
src/
├── types.ts    # 类型定义
├── screen.ts   # 屏幕截图模块
├── mouse.ts    # 鼠标控制模块
├── cli.ts      # CLI 命令行入口
└── index.ts    # 导出入口
```

## 依赖说明

| 包名 | 用途 |
|------|------|
| `screenshot-desktop` | 跨平台屏幕截图 |
| `@jitsi/robotjs` | 跨平台鼠标/键盘控制 |
| `commander` | CLI 命令行框架 |

## 开发

```bash
# 开发模式（热重载）
npm run dev

# 构建
npm run build

# 代码检查
npm run lint

# 格式化
npm run format

# 类型检查
npm run type-check
```

## License

MIT
