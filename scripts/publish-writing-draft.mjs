import {
  buildSite,
  commitIfNeeded,
  ensureDraftState,
  ensureOnlyAllowedChanges,
  ensureOnMainAndUpToDate,
  ensurePagesDeploy,
  ensurePostExists,
  parseArgs,
  pushMain,
} from './publish-writing-lib.mjs';

const repo = 'JingkaiTang/JingkaiTang.github.io';
const args = parseArgs(process.argv);

const slug = args.slug && args.slug !== 'true' ? args.slug : null;
const title = args.title && args.title !== 'true' ? args.title : null;

if (!slug) {
  console.error('Missing --slug <slug>.');
  process.exit(2);
}

const { postDir, postPath } = ensurePostExists(slug);
ensureDraftState(postPath, true);

ensureOnlyAllowedChanges([postDir, 'src/data/footer-gallery.json']);
ensureOnMainAndUpToDate();
buildSite();

const msg = title ? `Draft: ${title}` : `Draft: ${slug}`;
commitIfNeeded(msg, [postDir, 'src/data/footer-gallery.json']);
pushMain(repo);
ensurePagesDeploy(`/writing/${slug}/`);

console.log(`Draft published (hidden from feed): /writing/${slug}/`);
