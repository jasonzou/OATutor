import { defineConfig } from "vite";
import path from "path";

// Aliases previously provided by react-app-rewire-alias (config-overrides.js).
const alias = {
    "@components": path.resolve(__dirname, "src/components"),
    "@generated": path.resolve(__dirname, "generated"),
    // @common/global-config is also resolvable via the `file:./common` node_modules
    // symlink, but the explicit alias is more robust under esbuild pre-bundling.
    "@common/global-config": path.resolve(__dirname, "common/global-config.js"),
};

export default defineConfig({
    plugins: [],
    resolve: { alias },
    // CRA tolerated JSX inside `.js`; Vite's esbuild uses the JS loader for `.js`
    // by default (no JSX). Force the JSX loader for src and the automatic runtime
    // (some components use JSX without importing React, e.g. BuildTimeIndicator).
    esbuild: {
        loader: "jsx",
        include: /src\/.*\.jsx?$/,
        exclude: [],
        jsx: "automatic",
        jsxImportSource: "react",
    },
    optimizeDeps: {
        esbuildOptions: { loader: { ".js": "jsx" } },
    },
    // CRA exposes only REACT_APP_* vars; tell Vite to leak the same prefixes.
    envPrefix: ["VITE_", "REACT_APP_", "AI_"],
    define: {
        // CRA serves `public/` at PUBLIC_URL; Vite serves it at root, so the
        // base is the empty string (matches CRA's dev behavior).
        "process.env.PUBLIC_URL": JSON.stringify(""),
    },
    server: { port: 3001 },
    build: { outDir: "build" },
});
