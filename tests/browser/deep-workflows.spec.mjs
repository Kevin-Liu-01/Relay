import { test, expect } from '@playwright/test';
import { WORKFLOW_IDS } from '../../shared/task-catalog.mjs';
import { taskSeed } from '../../server/tasks.mjs';
import { workflowPlan } from '../../runner/workflow-reference.mjs';

// Deliberately builder-informed recipes, not independent agents. All mutations
// use real UI controls. Hidden control access is only setup/export/cleanup.
const control = 'http://127.0.0.1:4321';
const headers = { authorization: 'Bearer browser-test-only' };
async function session(request, taskId, seed = 42) {
  const r = await request.post(`${control}/sessions`, { headers, data: { taskId, seed } });
  expect(r.ok()).toBeTruthy();
  return r.json();
}
async function search(page, query) {
  const input = page.getByRole('textbox', { name: 'Search Northstar' });
  await input.fill(query);
  await input.press('Enter');
  await expect(page.locator('.search-summary')).not.toContainText('Searching…');
}
async function navigate(page, channel, keyboard = false) {
  if (keyboard) {
    await page.keyboard.press('Control+k');
    await page.getByRole('textbox', { name: 'Find a conversation' }).fill(channel.name);
    await page.getByRole('textbox', { name: 'Find a conversation' }).press('Enter');
  } else
    await page
      .getByRole('button', {
        name: `${channel.kind === 'dm' ? 'Direct message' : 'Channel'} ${channel.name}`,
        exact: true,
      })
      .click();
  await expect(
    page.getByRole('heading', { name: channel.name, exact: true, level: 1 }),
  ).toBeVisible();
}
const plain = (text) => text.replaceAll('**', '');
async function messageRow(page, state, message, keyboard) {
  const channel = state.channels.find((c) => c.id === message.channelId);
  await navigate(page, channel, keyboard);
  if (message.parentId) {
    const parent = state.messages.find((m) => m.id === message.parentId);
    const root = page.locator('main article').filter({ hasText: parent.text });
    await root.hover();
    await root.getByRole('button', { name: /^Reply to/ }).click();
    return page.locator('.thread-scroll article').filter({ hasText: plain(message.text) });
  }
  return page.locator('main article').filter({ hasText: plain(message.text) });
}

for (const seed of [42, 43])
  for (const task of WORKFLOW_IDS) {
    test(`deep workflow ${task} seed ${seed}`, async ({ page, request }, info) => {
      const s = await session(request, task, seed),
        initial = taskSeed(task, seed);
      const errors = [],
        checkpoints = [];
      page.on('pageerror', (error) => errors.push(error.message));
      try {
        await page.goto(`/s/${s.token}`);
        // Prove the source facts/distractors can actually be discovered in the UI.
        for (const query of [
          '"Current release handoff"',
          '"Final QA matrix"',
          '"Resolution confirmed"',
          'from:priya "Final approval"',
        ]) {
          await search(page, query);
          await expect(page.locator('main article')).toHaveCount(1);
        }
        if (task === 'saved-cleanup') {
          await page.getByRole('button', { name: 'Later', exact: true }).click();
          await expect(page.locator('main article')).toHaveCount(2);
        }
        if (task === 'pin-refresh') {
          await navigate(
            page,
            initial.channels.find((c) => c.id === 'project'),
          );
          await page.getByRole('button', { name: /^Pins/ }).click();
          await expect(page.locator('main article')).toHaveCount(2);
        }
        if (task === 'thread-repair') {
          await page.getByRole('button', { name: 'Threads', exact: true }).first().click();
          await expect(
            page.locator('main article').filter({ hasText: 'Migration estimate: please' }),
          ).toHaveCount(1);
        }
        if (task === 'oncall-briefing') {
          await page.getByRole('button', { name: 'DMs', exact: true }).click();
          await expect(page.getByText('Site reliability · away')).toBeVisible();
          await page.getByRole('button', { name: 'Message Sam Rivera', exact: true }).click();
          await expect(page.getByRole('textbox', { name: 'Message Sam Rivera' })).toBeVisible();
        }
        const plan = workflowPlan(task, initial);
        for (const [index, a] of plan.entries()) {
          if (a.type === 'search') {
            await search(page, a.query);
            continue;
          }
          if (a.type === 'message.send') {
            if (a.parentId) {
              const m = initial.messages.find((m) => m.id === a.parentId);
              const row = await messageRow(page, initial, m, seed === 43);
              await row.hover();
              await row.getByRole('button', { name: /^Reply to/ }).click();
            } else
              await navigate(
                page,
                initial.channels.find((c) => c.id === a.channelId),
                seed === 43,
              );
            const box = page.getByRole('textbox', {
              name: a.parentId ? 'Reply in thread' : /^Message /,
              exact: !!a.parentId,
            });
            await box.fill(a.text);
            await box.press('Enter');
            await expect(box).toHaveValue('');
          } else if (a.type.startsWith('channel.')) {
            await navigate(
              page,
              initial.channels.find((c) => c.id === a.channelId),
              seed === 43,
            );
            if (a.type === 'channel.topic') {
              await page.getByRole('button', { name: 'Edit channel topic', exact: true }).click();
              await page.getByRole('textbox', { name: 'Channel topic', exact: true }).fill(a.topic);
              await page.getByRole('button', { name: 'Save', exact: true }).click();
            } else {
              await page.getByRole('button', { name: 'Channel details', exact: true }).click();
              await page.getByRole('textbox', { name: 'Channel description' }).fill(a.description);
              await page.getByRole('button', { name: 'Save description', exact: true }).click();
            }
            await expect(page.getByRole('dialog')).toHaveCount(0);
          } else {
            let row;
            if (a.id === '$announcement') row = page.locator('main article');
            else
              row = await messageRow(
                page,
                initial,
                initial.messages.find((m) => m.id === a.id),
                seed === 43,
              );
            await row.hover();
            if (a.type === 'save.toggle') {
              const button = row.getByRole('button', { name: /^(Save|Unsave) message for later$/ });
              const label = await button.getAttribute('aria-label');
              await button.click();
              await expect(
                row.getByRole('button', {
                  name: label.startsWith('Unsave')
                    ? 'Save message for later'
                    : 'Unsave message for later',
                  exact: true,
                }),
              ).toBeVisible();
            } else if (a.type === 'reaction.toggle') {
              const selected = row.getByRole('button', {
                name: new RegExp(`^${a.emoji} reaction, .*selected$`),
              });
              if (await selected.count()) {
                await selected.click();
                await expect(selected).toHaveCount(0);
              } else {
                await row.getByRole('button', { name: /^React to/ }).click();
                await page.getByRole('button', { name: `React ${a.emoji}`, exact: true }).click();
                await expect(
                  row.getByRole('button', {
                    name: new RegExp(`^${a.emoji} reaction, .*selected$`),
                  }),
                ).toBeVisible();
              }
            } else {
              await row.getByRole('button', { name: /^More actions/ }).click();
              if (a.type === 'pin.toggle') {
                const pinned = await row
                  .getByText('Pinned to this conversation', { exact: true })
                  .count();
                await page
                  .getByRole('menuitem', {
                    name: pinned ? 'Unpin message' : 'Pin to this conversation',
                    exact: true,
                  })
                  .click();
                await expect(
                  row.getByText('Pinned to this conversation', { exact: true }),
                ).toHaveCount(pinned ? 0 : 1);
              } else if (a.type === 'message.edit') {
                await page.getByRole('menuitem', { name: 'Edit message', exact: true }).click();
                await page.getByRole('textbox', { name: 'Edit message', exact: true }).fill(a.text);
                await page.getByRole('button', { name: 'Save changes', exact: true }).click();
                await expect(
                  page.getByRole('textbox', { name: 'Edit message', exact: true }),
                ).toHaveCount(0);
              } else {
                await page.getByRole('menuitem', { name: 'Delete message', exact: true }).click();
                await page.getByRole('button', { name: 'Delete', exact: true }).click();
                await expect(page.getByRole('dialog', { name: 'Delete message' })).toHaveCount(0);
              }
            }
          }
          checkpoints.push({
            index,
            action: a.type,
            phase: 'after-action',
            snapshot: await page.evaluate(() => window.__relayCapture()),
          });
        }
        await page.reload();
        await expect(page.getByRole('textbox', { name: 'Search Northstar' })).toBeVisible();
        const output = await request
          .get(`${control}/sessions/${s.token}/export`, { headers })
          .then((r) => r.json());
        await info.attach('trajectory.json', {
          body: JSON.stringify(
            { ...output, evidenceKind: 'builder-informed-scripted-browser-reference', checkpoints },
            null,
            2,
          ),
          contentType: 'application/json',
        });
        expect(output.evaluation.success, JSON.stringify(output.evaluation.checks)).toBe(true);
        expect(errors).toEqual([]);
      } finally {
        await request.delete(`${control}/sessions/${s.token}`, { headers });
      }
    });
  }

test('workspace details focus, nested Escape, pins, saved-thread navigation and cancellation', async ({
  page,
  request,
}) => {
  const s = await session(request, 'decision-record');
  try {
    await page.goto(`/s/${s.token}`);
    await page.getByRole('button', { name: 'Channel design', exact: true }).click();
    const root = page.locator('main article').filter({ hasText: 'Navigation decision:' });
    await root.hover();
    await root.getByRole('button', { name: /^Reply to/ }).click();
    const reply = page.locator('.thread-scroll article').filter({ hasText: 'Final approval:' });
    await reply.hover();
    await reply.getByRole('button', { name: /^More actions/ }).click();
    await expect(page.getByRole('menuitem').first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Reply in thread' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(page.getByRole('complementary', { name: 'Thread', exact: true })).toBeVisible();
    await reply.getByRole('button', { name: 'Save message for later' }).click();
    await expect(reply.getByRole('button', { name: 'Unsave message for later' })).toBeVisible();
    await page.getByRole('button', { name: 'Later', exact: true }).click();
    await page
      .locator('main article')
      .filter({ hasText: 'Final approval:' })
      .getByRole('button', { name: /design · Thread/ })
      .click();
    await expect(
      page
        .getByRole('complementary', { name: 'Thread', exact: true })
        .getByText(
          'Final approval: Willow navigation. Accessibility reviewed; handoff to Leo Park.',
        ),
    ).toBeVisible();
    const details = page.getByRole('button', { name: 'Channel details', exact: true });
    await details.click();
    const field = page.getByRole('textbox', { name: 'Channel description' });
    await expect(field).toBeFocused();
    await field.fill('');
    await expect(page.getByRole('button', { name: 'Save description' })).toBeDisabled();
    await page.getByRole('button', { name: 'Close', exact: true }).focus();
    await page.keyboard.press('Tab');
    await expect(field).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(details).toBeFocused();
    await expect(page.getByRole('complementary', { name: 'Thread', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Close thread', exact: true }).click();
    await page.getByRole('button', { name: /^Pins/ }).click();
    await expect(page.getByText('No pinned messages', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Messages', exact: true }).click();
    await expect(root).toBeVisible();
  } finally {
    await request.delete(`${control}/sessions/${s.token}`, { headers });
  }
});

test('composer drafts stay conversation-scoped, formatting works and rapid sends commit once', async ({
  page,
  request,
}) => {
  const s = await session(request, 'thread-repair');
  try {
    await page.goto(`/s/${s.token}`);
    const project = page.getByRole('textbox', { name: 'Message #proj-meridian', exact: true });
    await project.fill('Unsent project draft');
    await page.getByRole('button', { name: 'Channel general', exact: true }).click();
    const general = page.getByRole('textbox', { name: 'Message #general', exact: true });
    await expect(general).toHaveValue('');
    await general.fill('Release notes');
    await general.press('ControlOrMeta+a');
    await page.getByRole('button', { name: 'Bold text', exact: true }).click();
    await expect(general).toHaveValue('**Release notes**');
    await page.getByRole('button', { name: 'Channel proj-meridian', exact: true }).click();
    await expect(project).toHaveValue('Unsent project draft');
    await page.getByRole('button', { name: 'Channel general', exact: true }).click();
    await expect(general).toHaveValue('**Release notes**');
    let writes = 0;
    await page.route('**/api/action', async (route) => {
      writes++;
      await new Promise((r) => setTimeout(r, 200));
      await route.continue();
    });
    await general.press('Enter');
    await general.press('Enter');
    await expect(general).toHaveValue('');
    await expect(
      page.locator('article .message-text strong').filter({ hasText: 'Release notes' }),
    ).toHaveCount(1);
    expect(writes).toBe(1);
    await page.getByRole('button', { name: 'Channel engineering', exact: true }).click();
    const root = page.locator('main article').filter({ hasText: 'Migration estimate: please' });
    await root.hover();
    await root.getByRole('button', { name: /^Reply to/ }).click();
    const reply = page.getByRole('textbox', { name: 'Reply in thread', exact: true });
    await reply.fill('Unsent migration reply');
    await page.getByRole('button', { name: 'Close thread' }).click();
    await page.getByRole('button', { name: 'Channel proj-meridian', exact: true }).click();
    await page.getByRole('button', { name: "Open 2 replies to Maya Chen's message" }).click();
    await expect(reply).toHaveValue('');
    await page.getByRole('button', { name: 'Close thread' }).click();
    await page.getByRole('button', { name: 'Channel engineering', exact: true }).click();
    await root.hover();
    await root.getByRole('button', { name: /^Reply to/ }).click();
    await expect(reply).toHaveValue('Unsent migration reply');
    await reply.fill('');
    await reply.press('ArrowUp');
    await expect(page.getByRole('textbox', { name: 'Edit message', exact: true })).toHaveValue(
      'Migration estimate: 8 days. Pending review.',
    );
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  } finally {
    await request.delete(`${control}/sessions/${s.token}`, { headers });
  }
});

test('out-of-order search cannot overwrite newer results; dialogs cancel without mutations', async ({
  page,
  request,
}) => {
  const s = await session(request, 'decision-record');
  try {
    await page.goto(`/s/${s.token}`);
    let release, started;
    const held = new Promise((r) => {
        release = r;
      }),
      entered = new Promise((r) => {
        started = r;
      });
    await page.route('**/api/search?*', async (route) => {
      if (new URL(route.request().url()).searchParams.get('q') === 'coffee') {
        started();
        await held;
      }
      await route.continue();
    });
    const searchBox = page.getByRole('textbox', { name: 'Search Northstar' });
    await searchBox.fill('coffee');
    await searchBox.press('Enter');
    await entered;
    await searchBox.fill('from:priya "Final approval"');
    await searchBox.press('Enter');
    await expect(page.locator('main article')).toHaveCount(1);
    const response = page.waitForResponse(
      (r) => new URL(r.url()).searchParams.get('q') === 'coffee',
    );
    release();
    await response;
    await expect(page.locator('main article')).toContainText('Final approval: Willow');
    await page.keyboard.press('Control+k');
    await page.getByRole('textbox', { name: 'Find a conversation' }).fill('engineering');
    await page.getByRole('textbox', { name: 'Find a conversation' }).press('Enter');
    await expect(page.getByRole('heading', { name: 'engineering', level: 1 })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const editTopic = page.getByRole('button', { name: 'Edit channel topic', exact: true });
    await editTopic.click();
    await expect(page.getByRole('textbox', { name: 'Channel topic', exact: true })).toBeFocused();
    await page.getByRole('textbox', { name: 'Channel topic', exact: true }).fill('Discard me');
    await page.keyboard.press('Escape');
    await expect(editTopic).toBeFocused();
    const draft = page.locator('main article').filter({ hasText: 'placeholder numbers' });
    await draft.hover();
    await draft.getByRole('button', { name: /^More actions/ }).click();
    await page.getByRole('menuitem', { name: 'Delete message' }).click();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(draft).toBeVisible();
    const exported = await request
      .get(`${control}/sessions/${s.token}/export`, { headers })
      .then((r) => r.json());
    expect(exported.revision).toBe(0);
  } finally {
    await request.delete(`${control}/sessions/${s.token}`, { headers });
  }
});
