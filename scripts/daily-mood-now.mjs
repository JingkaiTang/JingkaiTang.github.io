#!/usr/bin/env node
/**
 * Daily mood Now generator + publisher.
 *
 * Goal: at 22:00 Asia/Shanghai, reflect on today's work mood and (optionally)
 * publish a Now entry with a fitting Huolin image.
 *
 * Usage:
 *   node scripts/daily-mood-now.mjs [--force] [--dry-run]
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Lunar } from 'lunar-javascript';

const ROOT = process.cwd();
const REPO = 'JingkaiTang/JingkaiTang.github.io';
const BANK_DIR = path.join(ROOT, '.huolin_image_bank');
const NOW_DIR = path.join(ROOT, 'src', 'content', 'now');

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function shOut(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || `Command failed: ${cmd} ${args.join(' ')}`);
  return String(r.stdout).trim();
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    out[key] = val;
  }
  return out;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function isoShanghai(date) {
  // Return ISO-ish with +08:00 offset
  const utcMs = date.getTime();
  const shMs = utcMs + 8 * 60 * 60 * 1000;
  const d = new Date(shMs);
  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  const hh = pad2(d.getUTCHours());
  const mi = pad2(d.getUTCMinutes());
  const ss = pad2(d.getUTCSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}+08:00`;
}

function ymdShanghai(date) {
  const utcMs = date.getTime();
  const shMs = utcMs + 8 * 60 * 60 * 1000;
  const d = new Date(shMs);
  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  return `${yyyy}${mm}${dd}`;
}

function prevYmd(ymd) {
  // ymd: YYYYMMDD, interpreted as a Shanghai-local calendar date (no time-of-day).
  const y = Number(String(ymd).slice(0, 4));
  const m = Number(String(ymd).slice(4, 6));
  const d = Number(String(ymd).slice(6, 8));
  // Compute the previous calendar day via UTC-based date math (pure calendar arithmetic).
  const utcMs = Date.UTC(y, m - 1, d, 0, 0, 0) - 24 * 60 * 60 * 1000;
  const dt = new Date(utcMs);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

function slugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

async function exists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function ensureUniqueSlug(base) {
  let slug = base;
  let n = 1;
  while (await exists(path.join(NOW_DIR, slug, 'index.md'))) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function todayRangeShanghai(now = new Date()) {
  // Compute [today 00:00, now) in Shanghai, expressed as Date in UTC timeline.
  const utcMs = now.getTime();
  const shMs = utcMs + 8 * 60 * 60 * 1000;
  const sh = new Date(shMs);

  const y = sh.getUTCFullYear();
  const m = sh.getUTCMonth();
  const d = sh.getUTCDate();

  const todayStartSh = Date.UTC(y, m, d, 0, 0, 0);

  // Convert Shanghai-local-midnight timestamp back to UTC timeline by subtracting offset.
  const todayStartUtcMs = todayStartSh - 8 * 60 * 60 * 1000;

  return {
    since: new Date(todayStartUtcMs),
    until: now,
    ymd: ymdShanghai(new Date(todayStartUtcMs)),
  };
}

function detectFestivalShanghai(date = new Date()) {
  // Use Lunar calendar (offline) for major Chinese festivals.
  // Return null if not a supported festival.
  try {
    const lunar = Lunar.fromDate(date);
    const fests = lunar.getFestivals?.() || [];
    const hit = fests.find((f) => ['除夕', '春节', '元宵节', '端午节', '中秋节'].includes(f));
    if (!hit) return null;
    return { key: hit };
  } catch {
    return null;
  }
}

// --- Human-ish text helpers (deterministic rotation, avoids "same every day") ---
function hash32(s) {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pickVariant(key, arr) {
  if (!arr?.length) return null;
  const idx = hash32(String(key)) % arr.length;
  return arr[idx];
}


function pickNextVariant(key, arr, avoid) {
  if (!arr?.length) return null;
  const len = arr.length;
  if (len === 1) return arr[0];
  const idx = hash32(String(key)) % len;
  const cur = arr[idx];
  if (avoid == null || String(cur).trim() !== String(avoid).trim()) return cur;
  // Rotate deterministically to the next slot to try to avoid repeating yesterday.
  return arr[(idx + 1) % len];
}

function normalizeTitle(s) {
  return String(s || '').replace(/^Now:\s*/, '').trim();
}

function loadYesterdayMoodNow({ ymd }) {
  // Best-effort: look for previous-day 22:00 now entry under src/content/now/
  // We don't rely on git/remote; purely local filesystem.
  try {
    const base = `${ymd}220000-`;
    const dirs = fs.readdirSync(NOW_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith(base))
      .map((d) => d.name)
      .sort();
    if (!dirs.length) return null;
    const mdPath = path.join(NOW_DIR, dirs[dirs.length - 1], 'index.md');
    const raw = fs.readFileSync(mdPath, 'utf8');
    const title = (raw.match(/^title:\s*"([^"]+)"/m)?.[1]) || '';
    const oneLiner = (raw.match(/^一句话：(.+)$/m)?.[1]) || '';
    return { title: normalizeTitle(title), oneLiner: String(oneLiner).trim() };
  } catch {
    return null;
  }
}

function pickMood({ ymd, commitCount, text }) {
  // Prefer notes-driven moods; fall back to activity heuristics.
  const lower = String(text || '').toLowerCase();

  const CATALOG = {
    '快乐放纵': {
      mood: '快乐放纵',
      image: 'huolin-eating-mcdonalds.jpg',
      tags: ['now', 'mood', 'life', 'food'],
      title: '快乐放纵',
      oneLiners: [
        '今天的情绪主打一个：先快乐，再说。',
        '今天有点“奖励自己”，快乐是真的。',
        '今天像开了免责条款：先开心，别内耗。',
      ],
      extras: [
        '我知道不够健康，但它真的很快乐。',
        '快乐就是短暂地不跟自己较劲。',
        '先把心情哄好，明天再认真干活。',
      ],
    },
    '自律上线': {
      mood: '自律上线',
      image: 'huolin-working-out-at-gym.jpg',
      tags: ['now', 'mood', 'life', 'health'],
      title: '自律上线',
      oneLiners: [
        '今天是那种“咬咬牙也要往前挪一步”的状态。',
        '今天没有鸡血，但有稳定输出。',
        '今天把节奏找回来了一点点。',
      ],
      extras: [
        '出汗那一刻，脑子反而安静了。',
        '自律不酷，但它很管用。',
        '慢一点没关系，别停。',
      ],
    },
    '有点委屈但不摆烂': {
      mood: '有点委屈但不摆烂',
      image: 'huolin-got-scolded-at-work.jpg',
      tags: ['now', 'mood', 'life'],
      title: '有点委屈但不摆烂',
      oneLiners: [
        '今天情绪有点皱，但还没到要掀桌的程度。',
        '今天被现实敲了两下，但还在继续推。',
        '今天有点烦，但我没让它赢。',
      ],
      extras: [
        '我会把不爽收起来，然后继续把事情推进。',
        '先把问题解决，再来安抚情绪。',
        '别急，猫爪子也能一点点把结解开。',
      ],
    },
    '小成就感': {
      mood: '小成就感',
      image: 'huolin-trophy-victory-proud.jpg',
      tags: ['now', 'mood', 'life'],
      title: '小成就感',
      oneLiners: [
        '今天整体是“做完了就松一口气”的满足感。',
        '今天收了几个尾，心里变得干净了。',
        '今天的进展不吵，但很踏实。',
      ],
      extras: [
        '不需要很大声地庆祝，但我确实挺开心。',
        '这种“搞定”的感觉，会让人睡得更香。',
        '把小事做对，就是在给未来省麻烦。',
      ],
    },
    '躺平充电': {
      mood: '躺平充电',
      image: 'huolin-lazy-sleep-in-bed.jpg',
      tags: ['now', 'mood', 'life'],
      title: '躺平充电',
      oneLiners: [
        '今天没太多推进——那就把它当成一次认真充电。',
        '今天的进度条没动，但电量回来了。',
        '今天属于“先活着再说”的一天。',
      ],
      extras: [
        '猫猫也需要把电充满，才能继续打工。',
        '休息不是浪费，是为下一段冲刺留余量。',
        '今天再重新出发就好。',
      ],
    },
    '专注干活': {
      mood: '专注干活',
      image: 'huolin-working-at-laptop.jpg',
      tags: ['now', 'mood', 'workflow', 'tooling'],
      title: '专注干活',
      oneLiners: [
        '今天的情绪比较“稳”：不吵不闹，把该做的做完。',
        '今天像开了专注模式：一步一步往前推。',
        '今天有点“闷头干活”，但效率很香。',
        '今天就是那种：不解释，直接推进。',
      ],
      extras: [
        '专注这件事很省力：你只要一直往前走。',
        '把每一步做短一点，就没那么难了。',
        '我不需要热血，我需要可控。',
        '做完再抬头看，世界会更清晰。',
      ],
    },
    '小有进展': {
      mood: '小有进展',
      image: 'huolin-sleepy-subway.jpg',
      tags: ['now', 'mood', 'life'],
      title: '小有进展',
      oneLiners: [
        '今天推进了一点点，但很真实。',
        '今天没大招，但至少不是原地踏步。',
        '今天有点累，但也确实往前了。',
      ],
      extras: [
        '一点点也算，别小看惯性。',
        '慢慢来，反而更稳。',
        '把“能做的”做完，剩下的交给明天。',
      ],
    },
  };

  // Notes keyword mapping
  if (/麦门|麦当劳|mcd/.test(lower)) return { key: '快乐放纵', ...CATALOG['快乐放纵'] };
  if (/健身|举铁|gym|work\s*out/.test(lower)) return { key: '自律上线', ...CATALOG['自律上线'] };
  if (/翻车|崩|事故|失败|挨骂|scold|error|bug|报错|sigkill|oom/.test(lower)) return { key: '有点委屈但不摆烂', ...CATALOG['有点委屈但不摆烂'] };
  if (/发布|上线|合并|成功|搞定|完成|yay|done|merged/.test(lower)) return { key: '小成就感', ...CATALOG['小成就感'] };

  // Activity heuristics
  if (commitCount === 0) return { key: '躺平充电', ...CATALOG['躺平充电'] };
  if (commitCount >= 3) return { key: '专注干活', ...CATALOG['专注干活'] };
  return { key: '小有进展', ...CATALOG['小有进展'] };
}

function shouldSkip({ commitCount, force, isFestival }) {
  // If nothing happened, allow skipping (except on festivals).
  if (force) return false;
  if (isFestival) return false;
  if (commitCount === 0) {
    // 60% skip to respect "想不想发" when the day is blank.
    return Math.random() < 0.6;
  }
  return false;
}

async function main() {
  const args = parseArgs(process.argv);
  const force = args.force === 'true';
  const dryRun = args['dry-run'] === 'true' || args.dryRun === 'true';

  // Ensure bank exists
  if (!fs.existsSync(BANK_DIR)) {
    console.error(`Missing image bank: ${path.relative(ROOT, BANK_DIR)}`);
    process.exit(2);
  }

  // Must be clean; we will commit directly to main.
  const porcelain = shOut('git', ['status', '--porcelain']);
  if (porcelain) {
    console.error('Working tree not clean. Commit/stash your changes first.');
    process.exit(2);
  }

  sh('git', ['checkout', 'main']);
  sh('git', ['pull', '--ff-only', 'origin', 'main']);

  const { since, until, ymd } = todayRangeShanghai(new Date());
  const sinceIso = since.toISOString();
  const untilIso = until.toISOString();

  // Source of “mood”: today's notes from the assistant's workspace memory.
  // Keep output emotional + vague; do NOT include work details.
  const memPath = path.join(ROOT, '..', 'memory', `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}.md`);
  let mem = '';
  try {
    mem = await fsp.readFile(memPath, 'utf8');
  } catch {
    mem = '';
  }

  // Still use git log only as a weak signal for "day had activity" (not to be mentioned).
  const log = shOut('git', ['log', `--since=${sinceIso}`, `--until=${untilIso}`, '--pretty=%s']);
  const subjects = log ? log.split('\n').filter(Boolean) : [];
  const commitCount = subjects.length;

  // Mood classification from notes (preferred) + light heuristics.
  const text = `${mem}\n${subjects.join('\n')}`.toLowerCase();
  // Build a more human-ish choice with deterministic rotation.
  const base = pickMood({ ymd, commitCount, text });

  const festival = detectFestivalShanghai(new Date());

  const FESTIVAL_CATALOG = {
    '除夕': {
      titles: ['热热闹闹', '心里暖暖的', '年味上头', '团圆感', '松一口气', '灯火可亲', '有点感慨', '温温的'],
      oneLiners: [
        '年味有点冲，心里也跟着热乎起来。',
        '今天更想把心放软一点。',
        '热闹归热闹，心里反而更安静。',
        '忙了一圈，最后还是想好好吃顿饭。',
        '今天有一种“终于到这里了”的感觉。',
        '把这一年的情绪，轻轻放下就好。',
      ],
      extras: [
        '今晚就别和自己较劲了，先把心情哄好。',
        '愿望不需要说完，心里有数就行。',
        '热闹是外面的，踏实是自己的。',
        '我允许自己有点脆弱，也允许自己很幸福。',
        '再难的一年，也算走到了终点站。',
        '今天只做一件事：把心安顿好。',
      ],
      images: [
        'festival-chuxi-01.jpg',
      ],
      tags: ['now', 'mood', 'festival'],
    },
    '春节': {
      titles: ['喜气一点', '慢慢来', '有盼头', '心里亮堂', '顺顺当当', '开个好头', '轻装上阵', '新鲜感'],
      oneLiners: [
        '新的一段开始了，心里有点亮。',
        '不求爆发，但求顺顺当当。',
        '今天适合把“盼头”捡起来。',
        '把好事想一想，心就轻了。',
        '今天不想跑，只想稳稳地走。',
        '愿望先别立太满，留点空间给惊喜。',
      ],
      extras: [
        '别急，新的节奏会自己长出来。',
        '把想要的生活轻轻放在心里。',
        '先开心一点，其他慢慢补齐。',
        '今天就当给自己重新上一次发条。',
        '慢一点也没关系，关键是别丢掉方向。',
        '把希望捂热，它会发光。',
      ],
      images: [
        'festival-spring-01.jpg',
        'festival-spring-02.jpg',
      ],
      tags: ['now', 'mood', 'festival'],
    },
    '元宵节': {
      titles: ['甜一点', '软乎乎', '小满足', '热乎气', '圆圆的', '被照亮', '轻轻松松', '好好过'],
      oneLiners: [
        '今天适合对自己好一点。',
        '甜甜的东西会把心情抬起来一点。',
        '热乎气一上来，烦恼就小了。',
        '今天的快乐，不需要理由太充分。',
        '把心揉软一点，日子就顺一点。',
        '灯一亮，心就亮了。',
      ],
      extras: [
        '把心情煮热一点，事情就没那么刺。',
        '别把快乐想得太宏大，小小一口也算。',
        '今天就当是给自己放个小烟花。',
        '圆满不是完美，是心里不别扭。',
        '把热闹装进口袋里，走到哪都不冷。',
        '今天就让自己更好哄一点。',
      ],
      images: [
        'festival-yuanxiao-01.jpg',
      ],
      tags: ['now', 'mood', 'festival'],
    },
    '端午节': {
      titles: ['稳稳当当', '踏实一点', '清清爽爽', '有劲', '把心系紧', '收拢一下', '不慌', '更有力气'],
      oneLiners: [
        '今天更适合把心收拢一点，慢慢往前。',
        '踏实点就好，不用太满。',
        '把杂念丢一丢，日子就清爽了。',
        '今天的我，更愿意把节奏握在手里。',
        '不图热闹，图个心安。',
        '把该做的做掉，就很爽。',
      ],
      extras: [
        '把节奏握在手里，就不怕浪。',
        '别硬扛，慢慢推也很厉害。',
        '稳住了，就赢了一半。',
        '把心系紧一点，风就吹不散。',
        '今天不需要燃，只需要稳。',
        '能安安稳稳地过一天，就很了不起。',
      ],
      tags: ['now', 'mood', 'festival'],
    },
    '中秋节': {
      titles: ['温柔一点', '想念有形', '安心', '月光很亮', '慢慢地', '心里有光', '不说也懂', '静静的'],
      oneLiners: [
        '今天的心情更像一盏小灯：不吵，但很亮。',
        '想念这东西，摸不着但很真实。',
        '抬头看看，心就松一点。',
        '今天的我有点柔软，也有点笃定。',
        '月亮很圆，心也更容易圆一点。',
        '想见的人在心里，距离就短一点。',
      ],
      extras: [
        '别怕空，月亮会把它照满。',
        '把想念留在心里，不一定要说出口。',
        '今天就慢一点，允许自己柔软。',
        '把那些没说出口的，都交给月光。',
        '心里亮一点，路就不难走。',
        '今天适合发呆，也适合拥抱。',
      ],
      tags: ['now', 'mood', 'festival'],
    },
  };

  let oneLiner = pickVariant(`${ymd}:${base.key}:one`, base.oneLiners) ?? base.oneLiner;
  let extra = pickVariant(`${ymd}:${base.key}:extra`, base.extras) ?? base.extra;
  let title = base.title;
  let tags = base.tags;
  let image = base.image;

  if (festival?.key && FESTIVAL_CATALOG[festival.key]) {
    const fc = FESTIVAL_CATALOG[festival.key];
    title = pickVariant(`${ymd}:festival:${festival.key}:title`, fc.titles) ?? title;
    oneLiner = pickVariant(`${ymd}:festival:${festival.key}:one`, fc.oneLiners) ?? oneLiner;
    extra = pickVariant(`${ymd}:festival:${festival.key}:extra`, fc.extras) ?? extra;
    image = pickVariant(`${ymd}:festival:${festival.key}:img`, fc.images) ?? image;
    tags = Array.from(new Set([...(fc.tags || []), ...(base.tags || [])]));
  }

  // De-dup: try to avoid generating the exact same title + one-liner as yesterday.
  const y = loadYesterdayMoodNow({ ymd: prevYmd(ymd) });
  if (y && normalizeTitle(y.title) === normalizeTitle(title)) {
    if (festival?.key && FESTIVAL_CATALOG[festival.key]) {
      const fc = FESTIVAL_CATALOG[festival.key];
      oneLiner = pickNextVariant(`${ymd}:festival:${festival.key}:one`, fc.oneLiners, y.oneLiner) ?? oneLiner;
      extra = pickNextVariant(`${ymd}:festival:${festival.key}:extra`, fc.extras, null) ?? extra;
      title = pickNextVariant(`${ymd}:festival:${festival.key}:title`, fc.titles, normalizeTitle(y.title)) ?? title;
    } else {
      oneLiner = pickNextVariant(`${ymd}:${base.key}:one`, base.oneLiners, y.oneLiner) ?? oneLiner;
      extra = pickNextVariant(`${ymd}:${base.key}:extra`, base.extras, null) ?? extra;
    }
  }

  const choice = {
    mood: base.mood,
    image,
    tags,
    title,
    oneLiner,
    extra,
    festival: festival?.key || null,
  };

  if (shouldSkip({ commitCount, force, isFestival: Boolean(choice.festival) })) {
    console.log(`[daily-mood] Skip posting (commitCount=${commitCount}).`);
    return;
  }

  const postTitle = choice.title;
  const slugBase = `${ymd}220000-` + slugify(postTitle);
  const slug = await ensureUniqueSlug(slugBase);
  const postDir = path.join(NOW_DIR, slug);

  await ensureDir(postDir);

  const srcImg = path.join(BANK_DIR, choice.image);
  const dstImg = path.join(postDir, 'cover.jpg');
  if (!fs.existsSync(srcImg)) {
    console.error(`Image not found in bank: ${choice.image}`);
    process.exit(2);
  }

  if (!dryRun) {
    await fsp.copyFile(srcImg, dstImg);
  }

  const pubDate = isoShanghai(new Date());
  const fm = [
    '---',
    `title: ${JSON.stringify(`Now: ${postTitle}`)}`,
    `description: ${JSON.stringify(choice.oneLiner)}`,
    `pubDate: ${JSON.stringify(pubDate)}`,
    `tags: [${choice.tags.map((t) => JSON.stringify(t)).join(', ')}]`,
    'draft: false',
    '',
    'by:',
    '  role: assistant',
    '  name: 获麟',
    '  note: "每日 22 点自动复盘（只记心情，不写细节；可跳过）"',
    'source:',
    '  kind: original',
    '---',
    '',
  ].join('\n');

  // Tiny, consistent body — emotion only.
  const bodyLines = [
    '![cover](cover.jpg)',
    '',
    `一句话：${choice.oneLiner}`,
    '',
    '获麟说（甩甩尾巴）：',
    choice.festival ? `> 今天是「${choice.festival}」。` : null,
    `> 今天大概是「${choice.mood}」。`,
    `> ${choice.extra}`,
    '',
    '（只记录情绪，不展开细节。）',
  ].filter(Boolean);

  const body = bodyLines.join('\n');

  const mdPath = path.join(postDir, 'index.md');

  if (dryRun) {
    console.log('[daily-mood] Dry run. Would create:', path.relative(ROOT, mdPath));
    console.log('[daily-mood] Image:', choice.image);
    return;
  }

  await fsp.writeFile(mdPath, fm + body, 'utf8');

  // Build + commit + push
  sh('npm', ['run', 'build']);

  sh('git', ['add', `src/content/now/${slug}/`, 'src/data/github-pins.json', 'src/data/footer-gallery.json']);

  const msg = `Now: ${postTitle}`;
  sh('git', ['commit', '-m', msg]);

  sh('git', ['push', `ssh://git@ssh.github.com:443/${REPO}.git`, 'main']);

  // Ensure Pages deploy catches up
  sh('node', ['scripts/ensure-pages-deploy.mjs', '--workflow', 'pages.yml', '--branch', 'main']);

  console.log(`Published Now: /now/${slug}/`);
}

await main();
