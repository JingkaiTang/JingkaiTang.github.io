import crypto from 'node:crypto';
import matter from 'gray-matter';

export function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    out[key] = value;
  }
  return out;
}

export function sha256(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

export function parseWritingMarkdown(raw) {
  let parsed;
  try {
    parsed = matter(raw);
  } catch (error) {
    throw new Error(`无法解析博客 frontmatter: ${error.message}`);
  }

  const data = parsed.data ?? {};
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const cover = typeof data.cover === 'string' ? data.cover.trim() : '';
  const author = typeof data.by?.name === 'string' && data.by.name.trim()
    ? data.by.name.trim()
    : '唐靖凯';

  if (!title || !cover) {
    throw new Error('博客 frontmatter 必须包含 title 和 cover。');
  }

  return {
    title,
    cover,
    author,
    body: parsed.content,
    isDraft: data.draft === true,
    data,
  };
}

export function buildWechatMarkdown({ title, cover, author, sourceUrl, body }) {
  return matter.stringify(body, {
    title,
    cover,
    author,
    source_url: sourceUrl,
  });
}

export function extractMediaId(output) {
  const text = String(output ?? '');
  const patterns = [
    /Media ID:\s*([A-Za-z0-9_-]+)/i,
    /media[_-]?id\s*["']?\s*[:=]\s*["']([A-Za-z0-9_-]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const RISK_RULES = [
  {
    severity: 'high',
    code: 'secret-pattern',
    pattern: /(?:-----BEGIN (?:RSA|OPENSSH|EC|DSA|PRIVATE) KEY-----|\b(?:WECHAT_APP_SECRET|OPENAI_API_KEY|ANTHROPIC_API_KEY|AWS_SECRET_ACCESS_KEY|GH_TOKEN|GITHUB_TOKEN)\s*[:=]\s*[^\s`'"<>]+)/i,
    message: '疑似包含凭证、密钥或私密令牌',
  },
  {
    severity: 'high',
    code: 'shell-pipe',
    pattern: /\b(?:curl|wget)\b[^\n|]*\|\s*(?:ba|z|fi)?sh\b/i,
    message: '包含下载后直接交给 shell 执行的命令',
  },
  {
    severity: 'high',
    code: 'destructive-command',
    pattern: /\brm\s+-[a-z]*r[a-z]*f\s+(?:\/|~|\$HOME)\b/i,
    message: '包含可能破坏本机数据的递归删除命令',
  },
  {
    severity: 'high',
    code: 'privileged-command',
    pattern: /\bsudo\s+(?:rm|chmod|chown|dd|mkfs|shutdown|reboot)\b/i,
    message: '包含高权限系统命令',
  },
  {
    severity: 'medium',
    code: 'global-install',
    pattern: /\b(?:npm|pnpm|yarn)\s+(?:install|add)\s+-g\b/i,
    message: '包含全局安装依赖命令，可能触发审核或供应链风险',
  },
  {
    severity: 'medium',
    code: 'remote-download',
    pattern: /\b(?:curl|wget)\s+https?:\/\//i,
    message: '包含从网络下载内容的命令',
  },
];

export function scanWechatRisks(text) {
  const lines = String(text ?? '').split(/\r?\n/);
  const findings = [];
  for (const [index, line] of lines.entries()) {
    for (const rule of RISK_RULES) {
      if (rule.pattern.test(line)) {
        findings.push({
          severity: rule.severity,
          code: rule.code,
          line: index + 1,
          message: rule.message,
        });
      }
    }
  }
  return findings;
}

export function hasHighRisk(findings) {
  return findings.some((finding) => finding.severity === 'high');
}

export function summarizeOutput(output, maxLength = 1200) {
  const normalized = String(output ?? '').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}…`;
}

/**
 * @param {{
 *   slug: string,
 *   sourceCommit: string,
 *   sourceDigest: string,
 *   safeDigest: string,
 *   status: string,
 *   mediaId?: string|null,
 *   error?: string|null,
 *   submissionStatus?: string,
 *   previous?: Record<string, any>|null,
 * }} options
 */
export function buildPublishRecord({
  slug,
  sourceCommit,
  sourceDigest,
  safeDigest,
  status,
  mediaId = null,
  error = null,
  submissionStatus = status === 'submitted' ? 'submitted' : 'not_submitted',
  previous = null,
}) {
  const now = new Date().toISOString();
  return {
    version: 1,
    slug,
    sourceCommit,
    sourceDigest,
    safeDigest,
    status,
    submissionStatus,
    mediaId,
    error,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    submittedAt: status === 'submitted' ? now : (previous?.submittedAt ?? null),
  };
}

export function sameSource(record, { sourceDigest, safeDigest }) {
  return Boolean(
    record &&
      record.sourceDigest === sourceDigest &&
      record.safeDigest === safeDigest,
  );
}
