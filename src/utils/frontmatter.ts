/**
 * Frontmatter Parser - 简易 frontmatter 解析
 * 用于解析和序列化 YAML frontmatter
 */

interface FrontmatterResult {
  frontmatter: Record<string, any>
  body: string
}

/**
 * 解析 frontmatter
 */
export function parseFrontmatter(content: string): FrontmatterResult {
  // 检查是否有 frontmatter
  if (!content.startsWith('---')) {
    return { frontmatter: {}, body: content }
  }

  // 找到结束标记
  const endIndex = content.indexOf('\n---\n', 3)
  if (endIndex === -1) {
    return { frontmatter: {}, body: content }
  }

  // 提取 frontmatter 和 body
  const frontmatterStr = content.slice(3, endIndex)
  const body = content.slice(endIndex + 4)

  // 解析 YAML（简化实现）
  const frontmatter = parseYaml(frontmatterStr)

  return { frontmatter, body }
}

/**
 * 序列化 frontmatter
 */
export function stringifyFrontmatter(
  frontmatter: Record<string, any>,
  body: string
): string {
  const yamlStr = stringifyYaml(frontmatter)
  return `---\n${yamlStr}---\n\n${body}\n`
}

/**
 * 简化 YAML 解析器
 */
function parseYaml(yaml: string): Record<string, any> {
  const result: Record<string, any> = {}
  const lines = yaml.split('\n')

  for (const line of lines) {
    // 跳过空行
    if (!line.trim()) continue

    // 解析 key: value
    const match = line.match(/^(\w+):\s*(.*)$/)
    if (match) {
      const [, key, value] = match
      result[key] = parseValue(value)
    }
  }

  return result
}

/**
 * 解析 YAML 值
 */
function parseValue(value: string): any {
  // 去除引号
  value = value.trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  // 数组
  if (value.startsWith('[') && value.endsWith(']')) {
    const arrContent = value.slice(1, -1)
    return arrContent
      .split(',')
      .map((v: string) => parseValue(v.trim()))
      .filter((v: any) => v !== '')
  }

  // 布尔值
  if (value === 'true') return true
  if (value === 'false') return false

  // null
  if (value === 'null' || value === 'undefined') return null

  // 数字
  if (!isNaN(Number(value))) return Number(value)

  return value
}

/**
 * 简化 YAML 序列化
 */
function stringifyYaml(obj: Record<string, any>): string {
  const lines: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue

    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`)
    } else if (typeof value === 'string') {
      // 如果包含特殊字符，使用引号
      if (value.includes(':') || value.includes('#') || value.includes('\n')) {
        lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`)
      } else {
        lines.push(`${key}: ${value}`)
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`)
    } else if (value instanceof Date) {
      lines.push(`${key}: ${value.toISOString()}`)
    } else {
      lines.push(`${key}: ${value}`)
    }
  }

  return lines.join('\n')
}
