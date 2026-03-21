export function pickBestValuePackageId(ids: string[]): string | null {
  const annual = ids.find((i) => /year|annual|yearly/i.test(i));
  if (annual) {
    return annual;
  }
  const life = ids.find((i) => /life|lifetime/i.test(i));
  if (life) {
    return life;
  }
  return null;
}

export function displayTitleForPackage(pkg: {
  identifier: string;
  title: string;
}): string {
  const t = pkg.title.trim();
  if (t.length > 0) {
    return t;
  }
  const id = pkg.identifier.toLowerCase();
  if (id.includes("month")) {
    return "Monthly";
  }
  if (id.includes("year") || id.includes("annual")) {
    return "Yearly";
  }
  if (id.includes("life")) {
    return "Lifetime";
  }
  return pkg.identifier.replace(/_/g, " ");
}
