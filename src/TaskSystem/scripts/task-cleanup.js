/**
 * task-cleanup.js — 清理孤儿任务和过期文件
 * 
 * 用法: node task-cleanup.js [--dry-run] [--all]
 *   --dry-run: 只显示不执行
 *   --all: 包含已完成任务清理（默认只清理孤儿）
 */

const fs = require('fs');
const path = require('path');

const TASK_DIR = 'D:\\.openclaw\\workspace\\memory\\task';
const ORPHAN_THRESHOLD_MS = 60 * 60 * 1000; // 1小时未更新视为孤儿
const STALE_DONE_DAYS = 7; // 已完成超过7天视为过期

const dryRun = process.argv.includes('--dry-run');
const cleanAll = process.argv.includes('--all');

function readTaskFile(filePath) {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

function writeTaskFile(filePath, data) {
  const tmp = filePath + `.tmp.${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);
}

async function main() {
  console.log('\n========== 任务清理 ==========');
  if (dryRun) console.log('[Dry Run 模式 — 不实际执行]\n');

  const activeDir = path.join(TASK_DIR, '.active');
  const doneDir = path.join(TASK_DIR, '.done');
  const failedDir = path.join(TASK_DIR, '.failed');

  const now = Date.now();
  let orphanedCount = 0;
  let staleDoneCount = 0;

  // 1. 处理 DONE 状态任务（从 .active/ 移到 .done/）
  if (fs.existsSync(activeDir)) {
    for (const file of fs.readdirSync(activeDir)) {
      if (!file.endsWith('.json') || file.includes('-result')) continue;
      const task = readTaskFile(path.join(activeDir, file));
      if (!task) continue;

      if (task.status === 'DONE' || task.status === 'FAILED') {
        const targetDir = task.status === 'DONE' ? doneDir : failedDir;
        const action = dryRun ? '[DRY RUN] 迁移' : '迁移';
        
        console.log(`${action} ${task.status} 任务 ${task.taskId} → .${task.status === 'DONE' ? 'done' : 'failed'}/`);
        console.log(`         └─ ${task.name || task.taskId}`);

        if (!dryRun) {
          ensureDir(targetDir);
          writeTaskFile(path.join(targetDir, file), task);
          fs.unlinkSync(path.join(activeDir, file));
        }
        continue;
      }

      const updatedAt = new Date(task.updatedAt || task.createdAt).getTime();
      const elapsed = now - updatedAt;

      if (elapsed > ORPHAN_THRESHOLD_MS) {
        orphanedCount++;
        const elapsedMins = Math.floor(elapsed / 60000);
        const action = dryRun ? '[DRY RUN] 移动' : '移动';
        
        console.log(`${action} 孤儿任务 ${task.taskId} → .failed/（${elapsedMins}分钟无更新）`);
        console.log(`         └─ ${task.name}`);
        console.log(`           最后状态: ${task.progress?.percent || 0}% - ${task.progress?.step || '无'}`);

        if (!dryRun) {
          task.status = 'ORPHANED';
          task.error = `孤儿任务：超过 ${elapsedMins} 分钟无更新`;
          task.orphanedAt = new Date().toISOString();
          
          ensureDir(failedDir);
          writeTaskFile(path.join(failedDir, file), task);
          fs.unlinkSync(path.join(activeDir, file));
        }
      }
    }
  }

  // 2. 清理过期已完成任务（超过7天）
  if (cleanAll && fs.existsSync(doneDir)) {
    const staleDoneThreshold = now - (STALE_DONE_DAYS * 24 * 60 * 60 * 1000);

    for (const file of fs.readdirSync(doneDir)) {
      if (!file.endsWith('.json') || file.includes('-result')) continue;
      const task = readTaskFile(path.join(doneDir, file));
      if (!task || !task.completedAt) continue;

      const completedAt = new Date(task.completedAt).getTime();
      if (completedAt < staleDoneThreshold) {
        staleDoneCount++;
        const action = dryRun ? '[DRY RUN] 删除' : '删除';
        const daysAgo = Math.floor((now - completedAt) / (24 * 60 * 60 * 1000));
        
        console.log(`${action} 过期完成任务 ${task.taskId}（完成于 ${daysAgo} 天前）`);
        console.log(`         └─ ${task.name}`);

        if (!dryRun) {
          fs.unlinkSync(path.join(doneDir, file));
          // 同时删除 result 文件
          if (task.resultFile) {
            const resultPath = task.resultFile.startsWith('/') || task.resultFile.match(/^[A-Za-z]:/)
              ? task.resultFile
              : path.join(doneDir, '..', task.resultFile);
            if (fs.existsSync(resultPath)) {
              fs.unlinkSync(resultPath);
            }
          }
        }
      }
    }
  }

  console.log('\n---------- 清理结果 ----------');
  if (dryRun) console.log('[Dry Run] 无实际变更');
  console.log(`孤儿任务: ${orphanedCount} 个${dryRun ? ' (未执行)' : ''}`);
  if (cleanAll) {
    console.log(`过期已完成: ${staleDoneCount} 个${dryRun ? ' (未执行)' : ''}`);
  } else {
    console.log(`（使用 --all 可清理过期已完成任务，默认保留7天内）`);
  }
  console.log('==============================\n');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

main();
