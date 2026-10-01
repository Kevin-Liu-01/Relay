// Browser-side scheduling only. Each cell gets a separate server request, fresh
// workspace, full time allowance and independent audit. No retry or resume.
export function makeRunPlan({
  setup,
  provider,
  models,
  task,
  mode,
  guide,
  context,
  cap,
  steps,
  compare = false,
}) {
  if (
    !models.length ||
    models.length > 8 ||
    new Set(models.map((m) => m.id)).size !== models.length
  )
    throw Error('Choose 1–8 different models.');
  if (!Number.isFinite(cap) || cap < 0.01 || cap > setup.limits.maxEstimatedUSD)
    throw Error(`Allowance must be between $0.01 and $${setup.limits.maxEstimatedUSD} per model.`);
  if (!Number.isInteger(steps) || steps < 1 || steps > setup.limits.maxSteps)
    throw Error(`Choose 1–${setup.limits.maxSteps} actions per model.`);
  for (const model of models) {
    if (
      !model.rates ||
      !Number.isFinite(model.rates.input) ||
      model.rates.input <= 0 ||
      !Number.isFinite(model.rates.output) ||
      (provider === 'ramp' ? model.rates.output <= 0 : model.rates.output !== 0)
    )
      throw Error(`${model.id}: pricing unavailable.`);
    if (mode === 'pixels' && !compare && !model.vision)
      throw Error('Confirm image support in Run settings before a pixel run.');
  }
  const modes = compare
    ? provider === 'typesafe'
      ? ['a11y', 'json-ui']
      : ['a11y', 'json-ui', 'api']
    : [mode];
  return models.flatMap((model) =>
    modes.map((mode) => ({
      ...setup.defaults,
      provider,
      models: [{ id: model.id, rates: model.rates, vision: !!model.vision }],
      tasks: [task],
      interfaces: [mode],
      guides: [guide],
      histories: [context],
      maxSteps: steps,
      maxRequests: Math.min(setup.limits.maxRequests, Math.max(setup.defaults.maxRequests, steps)),
      maxEstimatedUSD: cap,
    })),
  );
}

export function queueMustStop(record) {
  return (
    !!record.error ||
    !record.run ||
    record.audit?.integrity?.status !== 'verified' ||
    record.run.budget?.usageKnown !== true
  );
}
