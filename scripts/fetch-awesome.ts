/**
 * Awesome-typesafe 列表抓取脚本（占位）
 *
 * 当前状态：项目数据来自 fetch-github.ts 的 GitHub Search API 抓取，
 * 不再维护独立的 awesome-typesafe.json 列表。
 *
 * 这个 stub 保证 `npm run fetch:all` 不会因为缺失文件而中断。
 *
 * 退出码：0，让 fetch:all 链式继续。
 */

console.log('[fetch-awesome] SKIPPED — 项目数据已统一由 fetch-github 抓取并写入 src/data/awesome-typesafe.json。');
console.log('[fetch-awesome] 旧的 awesome-typesafe.json 列表已弃用。');
process.exit(0);