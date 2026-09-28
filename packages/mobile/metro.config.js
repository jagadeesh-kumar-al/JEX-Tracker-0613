const { getDefaultConfig } = require("expo/metro-config");
const { resolve } = require("path");

const config = getDefaultConfig(__dirname);

// ── Workspace module resolution ────────────────────────────────────────
// Metro's project root is packages/mobile/. In a Bun workspace, packages
// installed via `npx expo install` may end up in packages/mobile/node_modules
// while hoisted deps live at the workspace root node_modules/. Tell Metro
// to search both so every install path resolves correctly.
const workspaceRoot = resolve(__dirname, "../..");

config.watchFolders = [workspaceRoot];
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [resolve(__dirname, "node_modules"), resolve(workspaceRoot, "node_modules")],
};

// ── "@/..." path alias ─────────────────────────────────────────────────
// Mirrors the `paths` mapping in tsconfig.json so Metro resolves the same
// imports the TypeScript compiler does.
const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const target = resolve(__dirname, moduleName.slice(2));
    return context.resolveRequest(context, target, platform);
  }
  return upstreamResolveRequest
    ? upstreamResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
