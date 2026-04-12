/**
 * task-spawn-prep.js — 准备任务元数据（仅创建 Task File，不 Spawn）
 * 
 * 用法: node task-spawn-prep.js <taskId> <taskName> <taskDescription> [timeoutMinutes]
 * 
 * 流程：
 * 1. 主会话（Agent）调用此脚本，创建 .active/{taskId}.json
 * 2. 主会话获得 worker prompt，调用 sessions_spawn tool
 * 3. 主会话收到 spawn 结果，更新 task file 为 IN_PROGRESS
 */

const fs = require('fs');
const path = require('path');

const TASK_DIR = 'D:\\.openclaw\\workspace\\memory\\task';
const TEMPLATE_PATH = 'D:\\.openclaw\\workspace\\templates\\worker-prompt.md';
const MAIN_SESSION_KEY = 'agent:main:feishu:direct:ou_755999aa81d7950e4a2a5f0190f0326e';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeTaskFile(filePath, data) {
  const tmp = filePath + `.tmp.${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);
}

function buildWorkerPrompt(taskId, taskName, taskDescription, timeoutMinutes) {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  return template
    .replace(/\{\{TASK_ID\}\}/g, taskId)
    .replace(/\{\{TASK_NAME\}\}/g, taskName)
    .replace(/\{\{TASK_DESCRIPTION\}\}/g, taskDescription)
    .replace(/\{\{TIMEOUT_MINUTES\}\}/g, timeoutMinutes || '60')
    .replace(/\{\{MAIN_SESSION_KEY\}\}/g, MAIN_SESSION_KEY)
    .replace(/\{\{TASK_DIR\}\}/g, TASK_DIR);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('用法: node task-spawn-prep.js <taskId> <taskName> <taskDescription> [timeoutMinutes]');
    console.error('示例: node task-spawn-prep.js task-001 "生成报告" "扫描workspace生成文件清单" 5');
    process.exit(1);
  }

  const [taskId, taskName, taskDescription, timeoutMinutes] = args;
  const activeDir = path.join(TASK_DIR, '.active');
  const activePath = path.join(activeDir, `${taskId}.json`);

  // 1. 检查重复
  if (fs.existsSync(activePath)) {
    console.error(`错误: 任务 ${taskId} 已存在于 .active/`);
    process.exit(1);
  }

  // 2. 创建任务元数据
  const taskMeta = {
    taskId,
    name: taskName,
    description: taskDescription,
    status: 'ASSIGNED',
    progress: { percent: 0, step: '等待 Worker 启动' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: MAIN_SESSION_KEY,
    timeoutMinutes: parseInt(timeoutMinutes) || 60,
    assignedSession: null,
    resultFile: null
  };

  ensureDir(activeDir);
  writeTaskFile(activePath, taskMeta);

  // 3. 构建 Worker Prompt
  const workerPrompt = buildWorkerPrompt(taskId, taskName, taskDescription, timeoutMinutes);

  // 4. 输出结果（供主会话提取）
  const result = {
    success: true,
    taskId,
    taskMeta,
    taskFilePath: activePath,
    workerPrompt,
    spawnParams: {
      label: `worker:${taskId}`,
      runtime: 'subagent',
      mode: 'session',
      cleanup: 'delete',
      runTimeoutSeconds: (parseInt(timeoutMinutes) || 60) * 60
    },
    instructions: [
      '1. Task File 已创建: ' + activePath,
      '2. 使用 sessions_spawn tool，传入上面的 workerPrompt 和 spawnParams',
      '3. Spawn 成功后，更新 task file status 为 IN_PROGRESS',
      '4. 完成后写入 .done/ 目录并发送 Feishu 通知'
    ]
  };

  console.log('\n=== TASK_SPAWN_PREP_RESULT ===');
  console.log(JSON.stringify(result, null, 2));
  console.log('=== END ===');
}

main().catch(e => { console.error('Fatal error:', e.message); process.exit(1); });
