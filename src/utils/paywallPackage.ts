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

export type BillingPeriod = "monthly" | "annual" | "lifetime";

export function deriveBillingPeriod(identifier: string): BillingPeriod {
  const id = identifier.toLowerCase();
  if (id.includes("life")) return "lifetime";
  if (id.includes("year") || id.includes("annual")) return "annual";
  return "monthly";
}

type PriceablePackage = { identifier: string; priceString: string };

function parsePrice(priceString: string): number | null {
  const cleaned = priceString.replace(/[^\d.,]/g, "").replace(",", ".");
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
}

export function calculateSavingsPercent(
  packages: PriceablePackage[],
): number | null {
  const monthly = packages.find(
    (p) => deriveBillingPeriod(p.identifier) === "monthly",
  );
  const annual = packages.find(
    (p) => deriveBillingPeriod(p.identifier) === "annual",
  );
  if (!monthly || !annual) return null;
  const mPrice = parsePrice(monthly.priceString);
  const aPrice = parsePrice(annual.priceString);
  if (!mPrice || !aPrice || mPrice <= 0) return null;
  const savings = ((mPrice - aPrice / 12) / mPrice) * 100;
  const rounded = Math.round(savings);
  return rounded >= 5 && rounded <= 99 ? rounded : null;
}

export function derivePerPeriodBreakdown(pkg: PriceablePackage): string | null {
  const period = deriveBillingPeriod(pkg.identifier);
  if (period === "lifetime") return null;
  const price = parsePrice(pkg.priceString);
  if (!price) return null;
  const symbolMatch = pkg.priceString.match(/^[^\d\s,]+/);
  const sym = symbolMatch ? symbolMatch[0] : "$";
  if (period === "annual") return `Only ${sym}${(price / 52).toFixed(2)}/week`;
  if (period === "monthly") return `${sym}${(price / 30).toFixed(2)}/day`;
  return null;
}
