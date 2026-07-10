export function getSafeRedirectPath(target: string | undefined, applicationOrigin: string) {
  if (!target || !target.startsWith("/") || /[\u0000-\u001f\u007f]/.test(target)) return "/";

  try {
    const applicationUrl = new URL(applicationOrigin);
    const resolved = new URL(target, applicationUrl);
    if (resolved.origin !== applicationUrl.origin) return "/";

    let inspectedPath = resolved.pathname;
    for (let index = 0; index < 10; index += 1) {
      const next = decodeURIComponent(inspectedPath);
      if (next === inspectedPath) break;
      inspectedPath = next;
      if (index === 9) return "/";
    }
    if (inspectedPath.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(inspectedPath)) return "/";

    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return "/";
  }
}
