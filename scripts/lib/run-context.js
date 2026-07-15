export function resolveRunStartedAt(
  environment = process.env,
  now = () => new Date(),
) {
  const supplied = environment.TESTARC_RUN_STARTED_AT?.trim();
  return supplied || now().toISOString();
}
