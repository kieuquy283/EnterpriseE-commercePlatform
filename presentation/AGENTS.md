# Presentation workspace

- Keep report facts aligned with `docs/spec/01-business.md` through `07-delivery.md`; label targets as targets and do not claim proposed behavior is implemented.
- The public library currently registers only the Vietnamese DAYMARK Week 6/10 deck. Keep retained older report sources unregistered unless explicitly requested.
- Use the approved DAYMARK swallow from `public/brand/`, with a `BASE_URL`-aware URL. Do not recreate or alter the master asset.
- Use the root npm workspace and lockfile. Do not add a presentation lockfile or another package manager.
- Keep changes inside `presentation/` unless the task explicitly expands scope.
- Run `npm run presentation:build` and `npm run presentation:test` from the repository root for implementation changes. Run browser validation when requested; report the exact revision and checks performed.
