/**
 * task-status.js — 查询任务状态
 * 
 * 用法: node task-status.js [taskId]
 * 不带参数：列出所有任务（活跃/已完成/失败）
 * 带参数：查询指定任务详情
 */

const fs = require('fs');
const path = require('path');

const TASK_DIR = 'D:\\.openclaw\\workspace\\memory\\task';

function readTaskFile(filePath) {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

function listTasks(dir) {
  const tasks = [];
  if (!fs.existsSync(dir)) return tasks;
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith('.json') && !file.includes('-result.json')) {
      const data = readTaskFile(path.join(dir, file));
      if (data) tasks.push(data);
    }
  }
  return tasks;
}

function formatElapsed(createdAt, updatedAt) {
  const updated = new Date(updatedAt || createdAt);
  const diff = Date.now() - updated.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

async function main() {
  const args = process.argv.slice(2);
  const taskId = args[0];

  if (taskId) {
    // 查询指定任务
    const active = readTaskFile(path.join(TASK_DIR, '.active', `${taskId}.json`));
    const done = readTaskFile(path.join(TASK_DIR, '.done', `${taskId}.json`));
    const failed = readTaskFile(path.join(TASK_DIR, '.failed', `${taskId}.json`));
    const task = active || done || failed;

    if (!task) {
      console.log(`任务 ${taskId} 不存在`);
      return;
    }

    const statusIcon = { IN_PROGRESS: '🔄', DONE: '✅', FAILED: '❌', ASSIGNED: '⏳', ORPHANED: '👻' }[task.status] || '❓';

    console.log('\n========== 任务详情 ==========');
    console.log(`任务ID:   ${task.taskId}`);
    console.log(`名称:     ${task.name}`);
    console.log(`状态:     ${statusIcon} ${task.status}`);
    console.log(`进度:     ${task.progress?.percent || 0}% - ${task.progress?.step || '无'}`);
    console.log(`创建:     ${task.createdAt} (${formatElapsed(task.createdAt, task.updatedAt)})`);
    if (task.updatedAt && task.updatedAt !== task.createdAt) {
      console.log(`更新:     ${task.updatedAt}`);
    }
    if (task.assignedSession) console.log(`Session:  ${task.assignedSession}`);
    if (task.completedAt) console.log(`完成:     ${task.completedAt}`);
    if (task.failedAt) console.log(`失败:     ${task.failedAt}`);
    if (task.error) console.log(`错误:     ${task.error}`);
    if (task.resultFile) console.log(`结果:     ${task.resultFile}`);
    if (task.summary) console.log(`摘要:     ${task.summary}`);
    console.log('==============================\n');

  } else {
    // 列出所有任务
    const activeTasks = listTasks(path.join(TASK_DIR, '.active'));
    const doneTasks = listTasks(path.join(TASK_DIR, '.done'));
    const failedTasks = listTasks(path.join(TASK_DIR, '.failed'));

    const total = activeTasks.length + doneTasks.length + failedTasks.length;
    console.log('\n========== 任务总览 ==========');
    console.log(`总计: ${total} 个任务\n`);

    if (activeTasks.length > 0) {
      console.log(`🔄 活跃任务 (${activeTasks.length})`);
      for (const t of activeTasks) {
        const elapsed = formatElapsed(t.createdAt, t.updatedAt);
        console.log(`  ${t.taskId} | ${t.name.substring(0, 20)} | ${t.progress?.percent || 0}% | ${elapsed}`);
        console.log(`         └─ ${t.progress?.step || '启动中'}`);
      }
      console.log('');
    }

    if (failedTasks.length > 0) {
      console.log(`❌ 失败任务 (${failedTasks.length})`);
      for (const t of failedTasks) {
        const err = t.error ? t.error.substring(0, 40) : '';
        console.log(`  ${t.taskId} | ${t.name.substring(0, 20)} | ${err}`);
      }
      console.log('');
    }

    if (doneTasks.length > 0) {
      console.log(`✅ 已完成任务 (${doneTasks.length})`);
      for (const t of doneTasks) {
        const resultFile = t.resultFile ? path.basename(t.resultFile) : '';
        console.log(`  ${t.taskId} | ${t.name.substring(0, 20)} | ${t.completedAt?.substring(0, 10) || ''}`);
        if (resultFile) console.log(`         └─ ${resultFile}`);
      }
      console.log('');
    }

    if (total === 0) {
      console.log('（暂无任务）\n');
    }

    console.log('==============================\n');
    console.log('用法: node task-status.js <taskId>  查看详情');
    console.log('      node task-status.js         刷新总览\n');
  }
}

main();
