import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const webpack = require("webpack");
const appRoot = path.resolve(__dirname);

function resolveFirebase(subpath) {
  // Always resolve to the ESM build so Next.js can bundle Firebase correctly.
  return path.join(
    appRoot,
    "node_modules",
    "firebase",
    subpath,
    "dist",
    "esm",
    "index.esm.js",
  );
}

/** Turbopack only accepts project-relative aliases (not absolute /app/... paths in Docker). */
function firebaseTurboAlias(pkg) {
  return `./node_modules/firebase/${pkg}/dist/esm/index.esm.js`;
}

/**
 * Turbopack can resolve `react` via the `react-server` export → `react.shared-subset.js`,
 * which breaks hooks (useContext from null) in client bundles. Force the full client build.
 * Do not add these to webpack — the App Router relies on react-server on the server.
 */
const reactTurboAliases = {
  react: "./node_modules/react/index.js",
  "react/jsx-runtime": "./node_modules/react/jsx-runtime.js",
  "react/jsx-dev-runtime": "./node_modules/react/jsx-dev-runtime.js",
  "react-dom": "./node_modules/react-dom/index.js",
  "react-dom/client": "./node_modules/react-dom/client.js",
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["firebase"],
  // Turbopack aliases (dev --turbo) mirror webpack — must be relative to this package root.
  experimental: {
    turbo: {
      resolveAlias: {
        ...reactTurboAliases,
        "firebase/app": firebaseTurboAlias("app"),
        "firebase/auth": firebaseTurboAlias("auth"),
        "firebase/analytics": firebaseTurboAlias("analytics"),
        "firebase/firestore": firebaseTurboAlias("firestore"),
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "firebase/app": resolveFirebase("app"),
      "firebase/auth": resolveFirebase("auth"),
      "firebase/analytics": resolveFirebase("analytics"),
      "firebase/firestore": resolveFirebase("firestore"),
    };
    if (dev) {
      // Do not merge into watchOptions.ignored — Next may use RegExp entries; webpack 5 then rejects
      // `ignored[0] should be a non-empty string` when the array mixes types.
      config.watchOptions = {
        ...config.watchOptions,
        aggregateTimeout: 600,
        ...(process.env.WATCHPACK_POLLING === "true" ? { poll: 1000 } : {}),
      };
      // Large Stitch export on the Docker bind mount — ignore via plugin (safe with any ignored shape).
      config.plugins.push(
        new webpack.WatchIgnorePlugin({
          paths: [path.join(appRoot, "design-reference")],
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
