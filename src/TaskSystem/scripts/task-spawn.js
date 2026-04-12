/**
 * task-spawn.js — 分配新任务到 Worker Session
 * 
 * 用法: node task-spawn.js <taskId> <taskName> <taskDescription> [timeoutMinutes]
 * 
 * 示例: node task-spawn.js task-001 "生成P4教案" "读取P4课程文件生成教案" 60
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const TASK_DIR = 'D:\\.openclaw\\workspace\\memory\\task';
const TEMPLATE_PATH = 'D:\\.openclaw\\workspace\\templates\\worker-prompt.md';
const MAIN_SESSION_KEY = 'agent:main:feishu:direct:ou_755999aa81d7950e4a2a5f0190f0326e';

// ============ 飞书 API ============

function feishuRequest(method, reqPath, data, token) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const req = https.request({ hostname: 'open.feishu.cn', path: reqPath, method, headers }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getFeishuToken() {
  const config = JSON.parse(fs.readFileSync('C:\\Users\\Administrator\\.openclaw\\openclaw.json', 'utf8'));
  const { appId, appSecret } = config.channels.feishu.accounts.default;
  const res = await feishuRequest('POST', '/open-apis/auth/v3/tenant_access_token/internal', { app_id: appId, app_secret: appSecret });
  return res.tenant_access_token;
}

// ============ OpenClaw Gateway RPC ============

async function gatewayRpc(method, params) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const body = JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() });
    const req = http.request({
      hostname: '127.0.0.1', port: 18789, path: '/rpc', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d);
          // RPC response format varies, extract result
          resolve(parsed.result || parsed);
        } catch { resolve(d); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ============ Task File 操作 ============

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeTaskFile(filePath, data) {
  const tmp = filePath + `.tmp.${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);
}

function moveTaskFile(taskId, fromDir, toDir) {
  ensureDir(toDir);
  const fromPath = path.join(fromDir, `${taskId}.json`);
  const toPath = path.join(toDir, `${taskId}.json`);
  if (fs.existsSync(fromPath)) {
    const data = JSON.parse(fs.readFileSync(fromPath, 'utf8'));
    writeTaskFile(toPath, data);
    fs.unlinkSync(fromPath);
    return true;
  }
  return false;
}

// ============ 主流程 ============

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('用法: node task-spawn.js <taskId> <taskName> <taskDescription> [timeoutMinutes]');
    process.exit(1);
  }

  const [taskId, taskName, taskDescription, timeoutMinutes] = args;
  const activeDir = path.join(TASK_DIR, '.active');

  // 1. 检查是否已有活跃任务
  const activePath = path.join(activeDir, `${taskId}.json`);
  if (fs.existsSync(activePath)) {
    console.error(`错误: 任务 ${taskId} 已存在且处于活跃状态`);
    process.exit(1);
  }

  console.log(`分配任务: ${taskId} - ${taskName}`);

  // 2. 读取 Worker 模板
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const workerPrompt = template
    .replace(/\{\{TASK_ID\}\}/g, taskId)
    .replace(/\{\{TASK_NAME\}\}/g, taskName)
    .replace(/\{\{TASK_DESCRIPTION\}\}/g, taskDescription)
    .replace(/\{\{TIMEOUT_MINUTES\}\}/g, timeoutMinutes || '60')
    .replace(/\{\{MAIN_SESSION_KEY\}\}/g, MAIN_SESSION_KEY)
    .replace(/\{\{TASK_DIR\}\}/g, TASK_DIR);

  // 3. 创建任务元数据
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
  console.log('✓ 任务元数据已写入 .active/');

  // 4. Spawn Worker Session
  console.log('正在启动 Worker Session...');
  try {
    const spawnResult = await gatewayRpc('sessions.spawn', {
      task: workerPrompt,
      label: `worker:${taskId}`,
      runtime: 'subagent',
      mode: 'session',
      cleanup: 'delete',
      runTimeoutSeconds: (parseInt(timeoutMinutes) || 60) * 60
    });

    // 5. 更新任务状态为 IN_PROGRESS
    taskMeta.status = 'IN_PROGRESS';
    taskMeta.assignedSession = spawnResult?.sessionKey || `worker:${taskId}`;
    taskMeta.assignedLabel = `worker:${taskId}`;
    taskMeta.progress = { percent: 0, step: 'Worker 已启动，正在执行', updatedAt: new Date().toISOString() };
    taskMeta.updatedAt = new Date().toISOString();
    writeTaskFile(activePath, taskMeta);

    console.log(`✓ Worker Session 已启动`);
    console.log(`  Session: ${taskMeta.assignedSession}`);
    console.log(`  任务状态: IN_PROGRESS`);
    console.log(`  超时时间: ${timeoutMinutes || 60} 分钟`);
    console.log(`\n任务已开始执行，完成后你会收到飞书通知。`);
  } catch (e) {
    // Spawn 失败，标记为 FAILED
    taskMeta.status = 'FAILED';
    taskMeta.error = `Worker 启动失败: ${e.message}`;
    taskMeta.failedAt = new Date().toISOString();
    ensureDir(path.join(TASK_DIR, '.failed'));
    moveTaskFile(taskId, '.active', '.failed');
    console.error(`✗ Worker 启动失败: ${e.message}`);
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
