import { chromium, devices } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

// Execution requires explicit permission to use Playwright instead of Work CUA.
// One isolated guest session. No credentials, provider APIs or application bypasses.
assert.equal(process.env.MAN_MOBILE_PLAYWRIGHT_AUTHORIZED, '1', 'Explicit Playwright authorization required');
const id = process.env.MAN_LESSON_ID;
assert.ok(['MAN-0165','MAN-0365','MAN-0044'].includes(id));
const realization = `${id}-OPENAI-FIXED-v0.2`;
const base = 'https://bttdavid1948-sudo.github.io/my-dictation-app/';
const out = new URL(`./evidence/${id}/`, import.meta.url);
await mkdir(out, { recursive: true });
const evidence = { status: 'RUNNING', scope: `${id}@v0.1 / ${realization}`,
  execution: 'PLAYWRIGHT_PIXEL_5_CHROMIUM_MOBILE_DEVICE_EMULATION',
  physicalDeviceVerified: false, startedAt: new Date().toISOString(), segments: [], layoutChecks: [] };
let browser, page;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...devices['Pixel 5'] });
  page = await context.newPage();
  evidence.browserVersion = browser.version();
  const errors = [];
  let webSpeechRequests = 0;
  await context.addInitScript(() => { if (window.speechSynthesis) {const original = window.speechSynthesis.speak.bind(window.speechSynthesis);window.speechSynthesis.speak=(...args)=>{window.dispatchEvent(new Event('man-smoke-webspeech'));return original(...args);};}});
  await page.exposeFunction('manSmokeWebSpeech',()=>{webSpeechRequests++;});
  await page.addInitScript(()=>window.addEventListener('man-smoke-webspeech',()=>window.manSmokeWebSpeech()));
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  evidence.runtime = await page.evaluate(() => ({ userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints, viewport: [innerWidth, innerHeight],
    deviceScaleFactor: devicePixelRatio, coarsePointer: matchMedia('(pointer: coarse)').matches,
    hover: matchMedia('(hover: hover)').matches }));
  assert.match(evidence.runtime.userAgent, /Android/);
  assert.ok(evidence.runtime.maxTouchPoints > 0);
  assert.equal(evidence.runtime.coarsePointer, true);
  assert.equal(evidence.runtime.hover, false);
  const catalogResponse = await context.request.get(new URL('assets/official-lessons.json', base).href);
  assert.ok(catalogResponse.ok());
  const catalog = await catalogResponse.json();
  const lesson = catalog.lessons.find(unit => unit.id === id);
  assert.equal(lesson.version, 'v0.1');
  assert.equal(lesson.audioRealizationRef, realization);
  assert.equal(lesson.status, 'published');

  // A tap includes hit testing after scrolling, so a blocking overlay fails execution.
  async function tap(locator, label) {
    await locator.scrollIntoViewIfNeeded();
    const layout = await locator.evaluate(el => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { rect: { x: r.x, y: r.y, width: r.width, height: r.height },
        unobstructed: !!top && (el === top || el.contains(top)),
        documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth };
    });
    assert.ok(layout.unobstructed, `${label}: blocking overlap`);
    assert.ok(layout.documentWidth <= layout.viewportWidth + 2, `${label}: horizontal overflow`);
    evidence.layoutChecks.push({ label, ...layout });
    await locator.tap();
  }
  // Resolve navigation from rendered controls, never invoke application handlers.
  const catalogNav = page.getByRole('button', { name: 'Kho bài học', exact: true });
  const visibleNav = [];
  for (const candidate of await catalogNav.all()) if (await candidate.isVisible()) visibleNav.push(candidate);
  assert.equal(visibleNav.length, 1, 'Expected one visible mobile catalog navigation control');
  await tap(visibleNav[0], 'mobile catalog navigation');
  const article = page.locator('article').filter({ has: page.getByRole('heading', { name: lesson.unitName, exact: true }) });
  await article.first().waitFor({ state: 'visible' });
  await page.screenshot({ path: new URL('mobile-catalog.png', out).pathname, fullPage: true });
  await tap(article.first().getByRole('button', { name: '🔥 Chiến bài này', exact: true }), `start ${id}`);
  for (let index = 0; index < lesson.items.length; index++) {
    const item = lesson.items[index];
    await page.locator('#progress-tag').filter({ hasText: `Câu ${index + 1}/${lesson.items.length}` }).waitFor();
    await tap(page.getByRole('button', { name: '🔊 Nghe lại', exact: true }), `play ${item.segmentId}`);
    const media = page.locator('#man-fixed-audio-player');
    await media.waitFor({ state: 'attached' });
    await page.waitForFunction(() => {
      const a = document.querySelector('#man-fixed-audio-player');
      return a && (a.error || (a.readyState === 4 && a.ended));
    }, null, { timeout: 15000 });
    const actual = await media.evaluate(a => ({ src: a.currentSrc, duration: a.duration,
      ended: a.ended, error: a.error && { code: a.error.code, message: a.error.message },
      readyState: a.readyState, dataset: { ...a.dataset } }));
    assert.equal(actual.error, null);
    assert.equal(actual.ended, true);
    assert.equal(actual.dataset.realizationId, realization);
    assert.equal(actual.dataset.segmentId, item.segmentId);
    assert.equal(actual.dataset.assetSha256, item.audio.sha256);
    assert.equal(actual.src, new URL(item.audio.url, base).href);
    const bytesResponse = await context.request.get(actual.src);
    assert.ok(bytesResponse.ok());
    assert.equal(createHash('sha256').update(await bytesResponse.body()).digest('hex'), item.audio.sha256);
    evidence.segments.push({ segmentId: item.segmentId, ...actual, hashVerified: true });
    if (index === 0) {
      await page.screenshot({ path: new URL('mobile-learning.png', out).pathname, fullPage: true });
      const report = page.getByRole('button', { name: '🔊 Âm thanh có vấn đề?', exact: true });
      await tap(report.filter({ visible: true }), 'open audio feedback');
      evidence.feedbackContext = JSON.parse(await page.locator('#x-audio-report-modal').getAttribute('data-audio-context'));
      assert.equal(evidence.feedbackContext.realizationId, realization);
      assert.equal(evidence.feedbackContext.lessonId, id);
      assert.equal(evidence.feedbackContext.lessonVersion, 'v0.1');
      assert.equal(evidence.feedbackContext.segmentId, item.segmentId);
      assert.equal(evidence.feedbackContext.assetSha256, item.audio.sha256);
      assert.equal(evidence.feedbackContext.deliveryMode, 'PERSISTED_ASSET');
      await page.locator('#x-audio-report-category').selectOption({ label: 'Vấn đề khác' });
      await page.locator('#x-audio-report-note').fill('OPERATIONS_MOBILE_SMOKE_TEST: exact fixed v0.2 release test, not a learner audio defect.');
      await tap(page.locator('#x-audio-report-send'), 'send mobile audio feedback');
      await page.locator('#x-audio-report-status').filter({ hasText: 'Đã gửi.' }).waitFor({ timeout: 15000 });
      evidence.feedbackDocumentId = await page.locator('#x-audio-report-status').getAttribute('data-report-id');
      assert.ok(evidence.feedbackDocumentId);
      evidence.feedbackWrite = 'ACKNOWLEDGED_BY_BACKEND';
      await page.screenshot({ path: new URL('mobile-feedback.png', out).pathname, fullPage: true });
      await tap(page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }), 'close audio feedback');
    }
    const input = page.locator('#user-input');
    await input.scrollIntoViewIfNeeded();
    await input.tap();
    await input.fill(item.en);
  }
  await page.getByRole('heading', { name: 'Bạn vừa làm được gì?', exact: true }).waitFor({ timeout: 15000 });
  assert.ok(await page.getByText(`Tự làm đúng ${lesson.items.length}/${lesson.items.length} câu.`, { exact: false }).isVisible());
  await page.screenshot({ path: new URL('mobile-completion.png', out).pathname, fullPage: true });
  evidence.completion = `${lesson.items.length}_OF_${lesson.items.length}`;
  evidence.pageErrors = errors;
  evidence.webSpeechRequests = webSpeechRequests;
  assert.equal(webSpeechRequests,0,'Silent Browser Voice substitution');
  assert.deepEqual(errors, []);
  evidence.status = 'MOBILE_EMULATED_FLOW_PASS_REQUIRES_OPERATIONS_REVIEW';
} catch (error) {
  await page?.screenshot({ path: new URL('mobile-failure.png', out).pathname, fullPage: true }).catch(() => {});
  evidence.status = 'FAIL_OR_BLOCKED'; evidence.failure = String(error.stack || error);
  process.exitCode = 1;
} finally {
  evidence.finishedAt = new Date().toISOString();
  await writeFile(new URL('mobile-evidence.json', out), JSON.stringify(evidence, null, 2));
  await browser?.close();
}
