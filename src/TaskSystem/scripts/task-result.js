/**
 * task-result.js — 读取任务结果
 * 
 * 用法: node task-result.js <taskId>
 */

const fs = require('fs');
const path = require('path');

const TASK_DIR = 'D:\\.openclaw\\workspace\\memory\\task';

async function main() {
  const args = process.argv.slice(2);
  const taskId = args[0];

  if (!taskId) {
    console.error('用法: node task-result.js <taskId>');
    process.exit(1);
  }

  // 先查主文件
  const donePath = path.join(TASK_DIR, '.done', `${taskId}.json`);
  if (!fs.existsSync(donePath)) {
    // 检查是否在 active 或 failed
    const activePath = path.join(TASK_DIR, '.active', `${taskId}.json`);
    const failedPath = path.join(TASK_DIR, '.failed', `${taskId}.json`);
    
    if (fs.existsSync(activePath)) {
      const task = JSON.parse(fs.readFileSync(activePath, 'utf8'));
      console.log(`\n任务 ${taskId} 仍在进行中：`);
      console.log(`  状态: ${task.status}`);
      console.log(`  进度: ${task.progress?.percent || 0}% - ${task.progress?.step || '无'}`);
      console.log(`  自 ${task.updatedAt} 后已 ${Math.floor((Date.now() - new Date(task.updatedAt).getTime()) / 60000)} 分钟\n`);
    } else if (fs.existsSync(failedPath)) {
      const task = JSON.parse(fs.readFileSync(failedPath, 'utf8'));
      console.log(`\n任务 ${taskId} 已失败：`);
      console.log(`  错误: ${task.error}`);
      console.log(`  失败时间: ${task.failedAt}\n`);
    } else {
      console.log(`任务 ${taskId} 不存在`);
    }
    return;
  }

  const task = JSON.parse(fs.readFileSync(donePath, 'utf8'));

  console.log('\n========== 任务结果 ==========');
  console.log(`任务ID:   ${task.taskId}`);
  console.log(`名称:     ${task.name}`);
  console.log(`状态:     ✅ ${task.status}`);
  console.log(`完成时间: ${task.completedAt || '无'}`);
  if (task.summary) console.log(`执行摘要: ${task.summary}`);
  console.log('==============================');

  // 读取实际结果文件
  if (task.resultFile) {
    const resultPath = task.resultFile.startsWith('/') || task.resultFile.match(/^[A-Za-z]:/)
      ? task.resultFile
      : path.join(TASK_DIR, '..', '..', task.resultFile);
    
    if (fs.existsSync(resultPath)) {
      const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      console.log('\n--- 输出详情 ---');
      if (result.message) console.log(result.message);
      if (result.outputs && result.outputs.length > 0) {
        console.log('\n输出文件:');
        for (const o of result.outputs) {
          console.log(`  [${o.type}] ${o.path}`);
          if (o.description) console.log(`           └─ ${o.description}`);
        }
      }
      if (result.metrics) {
        console.log('\n执行指标:');
        for (const [k, v] of Object.entries(result.metrics)) {
          console.log(`  ${k}: ${v}`);
        }
      }
    } else {
      console.log(`\n结果文件不存在: ${resultPath}`);
    }
  }

  console.log('\n==============================\n');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
