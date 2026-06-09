import { Command } from 'commander';
import { captureScreen, listScreens } from './screen';
import { click, getMousePos, moveMouse } from './mouse';
import { MouseButton } from './types';

const program = new Command();

program.name('screen-capture-click').description('屏幕截图 & 鼠标点击工具').version('1.0.0');

function parseMouseButton(button: string): MouseButton {
  switch (button) {
    case 'right':
      return MouseButton.Right;
    case 'middle':
      return MouseButton.Middle;
    default:
      return MouseButton.Left;
  }
}

/** 截图命令 */
program
  .command('screenshot')
  .description('截取当前屏幕')
  .option('-d, --dir <path>', '保存目录', './screenshots')
  .option('-p, --prefix <name>', '文件名前缀', 'screenshot')
  .option('-s, --screen <number>', '屏幕编号')
  .action(async (opts) => {
    try {
      const result = await captureScreen({
        saveDir: opts.dir,
        prefix: opts.prefix,
        screen: opts.screen ? parseInt(opts.screen, 10) : undefined,
      });
      console.log(`✅ 截图已保存: ${result.filePath} (${(result.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error('❌ 截图失败:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

/** 鼠标点击命令 */
program
  .command('click')
  .description('在指定位置点击鼠标')
  .requiredOption('-x, --x <number>', 'X 坐标')
  .requiredOption('-y, --y <number>', 'Y 坐标')
  .option('-b, --button <type>', '鼠标按键 (left|right|middle)', 'left')
  .option('--double', '双击', false)
  .option('--delay <ms>', '点击前延迟（毫秒）', '100')
  .action((opts) => {
    try {
      const x = parseInt(opts.x, 10);
      const y = parseInt(opts.y, 10);
      const button = parseMouseButton(opts.button);
      const delay = parseInt(opts.delay, 10);

      click({
        position: { x, y },
        button,
        doubleClick: opts.double,
        delay,
      });
      console.log(`✅ 已在 (${x}, ${y}) 位置执行${opts.double ? '双' : ''}击（${opts.button}）`);
    } catch (err) {
      console.error('❌ 点击失败:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

/** 获取鼠标位置命令 */
program
  .command('mousepos')
  .description('获取当前鼠标位置')
  .action(() => {
    const pos = getMousePos();
    console.log(`📍 当前鼠标位置: (${pos.x}, ${pos.y})`);
  });

/** 移动鼠标命令 */
program
  .command('move')
  .description('移动鼠标到指定位置')
  .requiredOption('-x, --x <number>', 'X 坐标')
  .requiredOption('-y, --y <number>', 'Y 坐标')
  .action((opts) => {
    const x = parseInt(opts.x, 10);
    const y = parseInt(opts.y, 10);
    moveMouse(x, y);
    console.log(`✅ 鼠标已移动到 (${x}, ${y})`);
  });

/** 列出屏幕命令 */
program
  .command('screens')
  .description('列出所有可用屏幕')
  .action(async () => {
    try {
      const screens = await listScreens();
      console.log('🖥️  可用屏幕:');
      screens.forEach((s, i) => console.log(`  [${i}] ${s.name} (id: ${s.id})`));
    } catch (err) {
      console.error('❌ 获取屏幕列表失败:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

/** 截图+点击组合命令 */
program
  .command('capture-and-click')
  .description('先截图，然后在指定位置点击')
  .requiredOption('-x, --x <number>', 'X 坐标')
  .requiredOption('-y, --y <number>', 'Y 坐标')
  .option('-d, --dir <path>', '截图保存目录', './screenshots')
  .option('-b, --button <type>', '鼠标按键 (left|right|middle)', 'left')
  .option('--delay <ms>', '点击前延迟（毫秒）', '200')
  .action(async (opts) => {
    try {
      // 先截图
      const result = await captureScreen({ saveDir: opts.dir });
      console.log(`✅ 截图已保存: ${result.filePath}`);

      // 再点击
      const x = parseInt(opts.x, 10);
      const y = parseInt(opts.y, 10);
      const button = parseMouseButton(opts.button);
      const delay = parseInt(opts.delay, 10);

      click({
        position: { x, y },
        button,
        delay,
      });
      console.log(`✅ 已在 (${x}, ${y}) 位置执行点击（${opts.button}）`);
    } catch (err) {
      console.error('❌ 操作失败:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse();
