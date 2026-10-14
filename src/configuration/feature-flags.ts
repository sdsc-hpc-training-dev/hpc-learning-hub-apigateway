export function privateFeaturesEnabled(
  value = process.env.ENABLE_PRIVATE_FEATURES,
): boolean {
  return value?.trim().toLowerCase() === 'true';
}
