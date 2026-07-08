## Variant: Icon Feed + Avatar Assets

This is a refinement of 004 focused on two quality issues:

1. Replace emoji/raw-symbol UI with a real icon library: Lucide, vendored locally at `assets/vendor/lucide.min.js`.
2. Replace inline placeholder heads with local generated SVG profile-image assets under `assets/avatars/`.

Image generation via Hermes was attempted first, but the current environment has no `FAL_KEY`/OpenAI image credential available. These SVG avatars are interim assets; the same tutor identities are ready to swap to real OpenAI/FAL generated profile images once image generation is configured.
