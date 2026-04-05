# Theme

## Shared Theme Files

- `src/theme/colors.ts`
- `src/theme/typography.ts`
- `src/theme/appBrand.ts`
- `src/theme/strings.ts`
- related background and vibe files in `src/theme/`

## Principles

- Shared colors, typography, and brand constants should be defined in `src/theme`.
- Avoid scattering repeated visual values across feature files.
- Preserve the app's immersive, layered, background-forward visual style.
- Add new tokens only when they represent reusable design language.

## Token Guidance

- Use `colors.ts` for semantic and shared colors.
- Use `typography.ts` for reusable type scales.
- Use `appBrand.ts` for app naming and brand constants.
- Use `strings.ts` for reusable user-facing copy where centralization helps consistency.
