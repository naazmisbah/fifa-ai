import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';

/**
 * Inject the strict Content-Security-Policy into production HTML only.
 * The built app is fully self-contained ('self' everywhere), but the Vite dev
 * server needs inline style/script injection for HMR, so the policy is added
 * at build time rather than hard-coded in index.html.
 */
const strictCsp = (): Plugin => ({
  name: 'matchday:strict-csp',
  apply: 'build',
  transformIndexHtml(html) {
    const policy = [
      "default-src 'self'",
      "img-src 'self' data:",
      "style-src 'self'",
      "script-src 'self'",
      "connect-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');
    return html.replace(
      '<meta charset="UTF-8" />',
      `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
    );
  },
});

// The production base path is supplied by the deploy workflow
// (`vite build --base=/<repo>/`) so a repository rename cannot break assets.
export default defineConfig({
  plugins: [preact(), strictCsp()],
});
