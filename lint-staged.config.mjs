const tooling = () => ["npm run format:check"]

export default {
  "{docs/**/*.md,README.md,CONTRIBUTING.md,AGENTS.md,**/AGENTS.md,.agents/skills/daymark-aws/**/*.md,scripts/check-docs.mjs}":
    () => "npm run docs:check",
  "{.oxfmtrc.json,lint-staged.config.mjs,.husky/pre-commit}": tooling,
  "*.{ts,tsx,js,jsx,mjs,cjs,json,jsonc,css,scss,html,yml,yaml,md,mdx}":
    "oxfmt --check --config .oxfmtrc.json --no-error-on-unmatched-pattern",
  "apps/backend/**/*.{ts,tsx,js,json}": () => "npm run lint --workspace=@dtc/backend",
  "apps/storefront/**/*.{ts,tsx,js,mjs,json}": () => "npm run lint --workspace=@dtc/storefront",
  "presentation/**/*.{ts,tsx,js,mjs,json,css}": () => [
    "npm run typecheck --workspace=presentation",
    "npm run presentation:test",
  ],
  "{package.json,package-lock.json,turbo.json,eslint.config.ts}": () => [
    ...tooling(),
    "npm run lint --workspace=@dtc/backend",
    "npm run lint --workspace=@dtc/storefront",
  ],
}
