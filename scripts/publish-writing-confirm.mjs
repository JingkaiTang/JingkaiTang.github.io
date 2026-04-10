import {
  buildSite,
  commitIfNeeded,
  ensureDraftState,
  ensureOnMainAndUpToDate,
  ensurePagesDeploy,
  ensurePostExists,
  parseArgs,
  pushMain,
  replaceDraftFlag,
} from './publish-writing-lib.mjs';

const repo = 'JingkaiTang/JingkaiTang.github.io';
const args = parseArgs(process.argv);

const slug = args.slug && args.slug !== 'true' ? args.slug : null;
const title = args.title && args.title !== 'true' ? args.title : null;
const message = args.message && args.message !== 'true' ? args.message : null;

if (!slug) {
  console.error('Missing --slug <slug>.');
  process.exit(2);
}

const { postDir, postPath } = ensurePostExists(slug);
ensureDraftState(postPath, true);

ensureOnMainAndUpToDate();
replaceDraftFlag(postPath, false);
buildSite();

const msg = message
  ? message
  : title
    ? `Writing: ${title}`
    : `Writing: ${slug}`;

commitIfNeeded(msg, [postDir, 'src/data/footer-gallery.json']);
pushMain(repo);
ensurePagesDeploy();

console.log(`Published Writing: /writing/${slug}/`);
