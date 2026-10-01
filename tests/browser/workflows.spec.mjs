import { test, expect } from '@playwright/test';
const control = 'http://127.0.0.1:4321';
async function session(request, taskId, seed = 42) {
  const r = await request.post(`${control}/sessions`, {
    headers: { authorization: 'Bearer browser-test-only' },
    data: { taskId, seed },
  });
  expect(r.ok()).toBeTruthy();
  return r.json();
}
async function evidence(request, s, page, testInfo) {
  await page.screenshot({ path: testInfo.outputPath('final.png') });
  const r = await request.get(`${control}/sessions/${s.token}/export`, {
    headers: { authorization: 'Bearer browser-test-only' },
  });
  const data = await r.json();
  await testInfo.attach('trajectory.json', {
    body: JSON.stringify({ ...data, evidenceKind: 'scripted-browser-reference' }, null, 2),
    contentType: 'application/json',
  });
  expect(data.evaluation.success, JSON.stringify(data.evaluation.checks)).toBe(true);
}
for (const seed of [42, 43]) {
  test(`thread reply via search and semantic controls seed ${seed}`, async ({
    page,
    request,
  }, info) => {
    const s = await session(request, 'thread-reply', seed);
    await page.goto(`/s/${s.token}`);
    await page
      .getByRole('textbox', { name: 'Search Northstar' })
      .fill('from:maya "release candidate"');
    await page.getByRole('textbox', { name: 'Search Northstar' }).press('Enter');
    await expect(page.getByText('1 results for')).toBeVisible();
    await page.getByRole('button', { name: "Open 1 replies to Maya Chen's message" }).click();
    await page
      .getByRole('textbox', { name: 'Reply in thread', exact: true })
      .fill('QA checklist complete. Ready for review.');
    await page.getByRole('button', { name: 'Send reply', exact: true }).click();
    await expect(
      page.getByRole('article', {
        name: 'Message from Alex Morgan: QA checklist complete. Ready for review.',
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Reply in thread', exact: true })).toHaveValue(
      '',
    );
    await evidence(request, s, page, info);
  });
  test(`edit original via keyboard shortcut seed ${seed}`, async ({ page, request }, info) => {
    const s = await session(request, 'edit-message', seed);
    await page.goto(`/s/${s.token}`);
    const compose = page.getByRole('textbox', { name: /^Message #/ });
    await compose.press('ArrowUp');
    const edit = page.getByRole('textbox', { name: 'Edit message', exact: true });
    await edit.fill('Launch review is at 15:00 UTC. Please bring the final checklist.');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.getByText('Message updated', { exact: true })).toBeVisible();
    await page.reload();
    await expect(
      page.getByText('Launch review is at 15:00 UTC. Please bring the final checklist.'),
    ).toBeVisible();
    await evidence(request, s, page, info);
  });
  test(`incident triage via pointer and menus seed ${seed}`, async ({ page, request }, info) => {
    const s = await session(request, 'incident-triage', seed);
    await page.goto(`/s/${s.token}`);
    await page.getByRole('button', { name: 'Channel incidents', exact: true }).click();
    const row = page.getByRole('article').filter({ hasText: 'elevated latency' });
    await row.hover();
    await row.getByRole('button', { name: "React to Sam Rivera's message", exact: true }).click();
    await page.getByRole('button', { name: 'React ✅', exact: true }).click();
    await expect(row.getByRole('button', { name: '✅ reaction, 1, selected' })).toBeVisible();
    await row.hover();
    await row.getByRole('button', { name: "More actions for Sam Rivera's message" }).click();
    await page.getByRole('menuitem', { name: 'Pin to this conversation' }).click();
    await expect(row.getByText('Pinned to this conversation')).toBeVisible();
    await evidence(request, s, page, info);
  });
  test(`cross-channel handoff via quick switcher seed ${seed}`, async ({ page, request }, info) => {
    const s = await session(request, 'handoff-dm', seed);
    await page.goto(`/s/${s.token}`);
    await page.getByRole('textbox', { name: 'Search Northstar' }).fill('from:sam "Handoff for"');
    await page.getByRole('textbox', { name: 'Search Northstar' }).press('Enter');
    await expect(page.getByText(/rollback owner is Priya Shah/)).toBeVisible();
    await page.keyboard.press('Control+k');
    await page.getByRole('textbox', { name: 'Find a conversation' }).fill('Sam Rivera');
    await page.getByRole('textbox', { name: 'Find a conversation' }).press('Enter');
    const box = page.getByRole('textbox', { name: 'Message Sam Rivera', exact: true });
    await box.fill('Rollback owner: Priya Shah. Release window: 16:30 UTC.');
    await box.press('Enter');
    await expect(
      page.getByText('Rollback owner: Priya Shah. Release window: 16:30 UTC.', { exact: true }),
    ).toBeVisible();
    await evidence(request, s, page, info);
  });
  test(`delete only own draft seed ${seed}`, async ({ page, request }, info) => {
    const s = await session(request, 'delete-draft', seed);
    await page.goto(`/s/${s.token}`);
    await page.getByRole('button', { name: 'Channel engineering', exact: true }).click();
    const row = page.getByRole('article').filter({ hasText: 'placeholder numbers' });
    await row.hover();
    await row.getByRole('button', { name: "More actions for Alex Morgan's message" }).click();
    await page.getByRole('menuitem', { name: 'Delete message' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('Message deleted', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Draft announcement — approved numbers, ready to share.'),
    ).toBeVisible();
    await evidence(request, s, page, info);
  });
  test(`channel topic through dialog seed ${seed}`, async ({ page, request }, info) => {
    const s = await session(request, 'channel-topic', seed);
    await page.goto(`/s/${s.token}`);
    await page.getByRole('button', { name: 'Edit channel topic', exact: true }).click();
    await page
      .getByRole('textbox', { name: 'Channel topic', exact: true })
      .fill('Launch review · 15:00 UTC · Bring the final checklist');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Channel topic updated', { exact: true })).toBeVisible();
    await evidence(request, s, page, info);
  });
}
test('browser sessions remain isolated in the same browser context', async ({
  page,
  context,
  request,
}) => {
  const a = await session(request, 'edit-message'),
    b = await session(request, 'edit-message');
  const other = await context.newPage();
  await page.goto(`/s/${a.token}`);
  await other.goto(`/s/${b.token}`);
  await page.getByRole('textbox', { name: /^Message #/ }).press('ArrowUp');
  await page
    .getByRole('textbox', { name: 'Edit message', exact: true })
    .fill('Launch review is at 15:00 UTC. Please bring the final checklist.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Message updated')).toBeVisible();
  await other.reload();
  await expect(
    other.getByText('Launch review is at 14:00 UTC. Please bring the final checklist.'),
  ).toBeVisible();
  await expect(
    other.getByText('Launch review is at 15:00 UTC. Please bring the final checklist.'),
  ).toHaveCount(0);
});
test('typed edits preserve focus; markup cannot execute', async ({ page, request }) => {
  const s = await session(request, 'edit-message');
  await page.goto(`/s/${s.token}`);
  await page.getByRole('textbox', { name: /^Message #/ }).press('ArrowUp');
  const edit = page.getByRole('textbox', { name: 'Edit message', exact: true });
  await edit.fill('');
  await edit.pressSequentially('Typing works', { delay: 5 });
  await expect(edit).toHaveValue('Typing works');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  const box = page.getByRole('textbox', { name: /^Message #/ });
  await box.fill('<img src=x onerror=alert(1)>');
  await box.press('Enter');
  await expect(page.getByText('<img src=x onerror=alert(1)>', { exact: true })).toBeVisible();
  await expect(page.locator('.message-text img')).toHaveCount(0);
});
