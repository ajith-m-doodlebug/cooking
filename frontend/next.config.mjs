import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["firebase"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "firebase/app": resolveFirebase("app"),
      "firebase/auth": resolveFirebase("auth"),
      "firebase/analytics": resolveFirebase("analytics"),
      "firebase/firestore": resolveFirebase("firestore"),
    };
    return config;
  },
};

export default nextConfig;
