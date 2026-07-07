/** @type {import('next').NextConfig} */
const nextConfig = {
    // ── Security Headers ──────────────────────────────────────────────
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                ],
            },
        ];
    },

    // ── Source Map Fix for framer-motion 12.x ────────────────────────
    productionBrowserSourceMaps: false,

    webpack: (config, { dev, isServer }) => {
        // Fix: Disable source maps properly for both dev and production
        if (!dev) {
            config.devtool = false;
        } else {
            // In dev mode use eval source maps - these don't generate
            // separate .map file requests, preventing 404s for
            // framer-motion's embedded source map references
            config.devtool = 'eval-source-map';
        }

        // Strip embedded `//# sourceMappingURL=` comments from all
        // JS/MJS output assets. framer-motion 12.x bundles these
        // comments in its source files and webpack preserves them
        // in the output chunks, causing browsers to request
        // non-existent .map files (404 errors).
        const { webpack: wp } = config;
        if (wp) {
            config.plugins.push(
                new (class StripSourceMapCommentsPlugin {
                    apply(compiler) {
                        compiler.hooks.thisCompilation.tap(
                            'StripSourceMapCommentsPlugin',
                            (compilation) => {
                                compilation.hooks.processAssets.tap(
                                    {
                                        name: 'StripSourceMapCommentsPlugin',
                                        stage: compiler.webpack.Compilation
                                            .PROCESS_ASSETS_STAGE_OPTIMIZE,
                                    },
                                    (assets) => {
                                        for (const [name, asset] of Object.entries(assets)) {
                                            if (
                                                name.endsWith('.js') ||
                                                name.endsWith('.mjs')
                                            ) {
                                                let source = asset.source();

                                                // Handle both string and Buffer sources
                                                if (typeof source !== 'string') {
                                                    source = source.toString();
                                                }

                                                // Check for any sourceMappingURL comment and strip it.
                                                // framer-motion 12.x embeds comments like:
                                                //   //# sourceMappingURL=LayoutGroupContext.mjs.map
                                                // These cause browsers to request non-existent .map files.
                                                if (source.includes('sourceMappingURL=')) {
                                                    assets[name] =
                                                        new compiler.webpack.sources.RawSource(
                                                            source.replace(
                                                                /\/\/#\s*sourceMappingURL=[^\n]*/g,
                                                                ''
                                                            )
                                                        );
                                                }
                                            }
                                        }
                                    }
                                );
                            }
                        );
                    }
                })()
            );
        }

        return config;
    },
};

export default nextConfig;
