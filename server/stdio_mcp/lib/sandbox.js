// server/stdio_mcp/lib/sandbox.js
//
// Filesystem sandbox security.
//
// Responsibilities:
// - Define the allowed local_data directory.
// - Prevent directory traversal.
// - Prevent absolute-path access.
// - Prevent symlink escapes.
//
// Any future MCP tool that accesses local_data should reuse these
// helpers instead of implementing its own path checks.

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// ES modules do not automatically provide __filename/__dirname.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// lib/ is inside stdio_mcp/, so move one directory upward and
// select local_data.
//
// Example:
//
// stdio_mcp/
//   lib/
//     sandbox.js
//   local_data/
export const SANDBOX_ROOT = path.resolve(
  __dirname,
  "..",
  "local_data"
);

/**
 * Ensure local_data exists.
 *
 * recursive: true makes this safe when the directory already exists.
 */
export async function ensureSandboxExists() {
  await fs.mkdir(SANDBOX_ROOT, {
    recursive: true,
  });
}

/**
 * Determine whether targetPath belongs to rootPath.
 *
 * path.relative() gives us a platform-independent way to perform
 * this check on Windows, macOS, and Linux.
 */
function isPathInside(rootPath, targetPath) {
  const relativePath = path.relative(rootPath, targetPath);

  return !(
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  );
}

/**
 * Convert a caller-provided relative filename into an absolute
 * path inside local_data.
 *
 * This is the first security boundary. It blocks inputs such as:
 *
 * ../.env
 * ../../secret.txt
 * /etc/passwd
 * C:\Windows\...
 */
export function resolveSandboxPath(fileName) {
  if (typeof fileName !== "string" || !fileName.trim()) {
    throw new Error(
      "fileName must be a non-empty string."
    );
  }

  // Null bytes can result in confusing or unsafe behavior in
  // filesystem/path APIs.
  if (fileName.includes("\0")) {
    throw new Error("Invalid fileName.");
  }

  const normalizedInput = fileName.trim();

  // The public API accepts only paths relative to local_data.
  if (path.isAbsolute(normalizedInput)) {
    throw new Error(
      "Absolute paths are not allowed."
    );
  }

  // path.resolve() normalizes "." and ".." components.
  const resolvedPath = path.resolve(
    SANDBOX_ROOT,
    normalizedInput
  );

  // Verify that normalization did not move the requested path
  // outside the sandbox.
  if (!isPathInside(SANDBOX_ROOT, resolvedPath)) {
    throw new Error(
      "Requested file is outside the allowed sandbox."
    );
  }

  return resolvedPath;
}

/**
 * Resolve an existing sandbox path to its canonical filesystem path
 * and verify that symbolic links have not escaped local_data.
 *
 * Why this second check is necessary:
 *
 * A path may appear to belong to local_data:
 *
 *   local_data/secret-link
 *
 * while secret-link could actually point to:
 *
 *   /some/private/secret.txt
 *
 * The normal path.resolve() check cannot detect that because it does
 * not follow symbolic links. fs.realpath() does.
 */
export async function resolveSafeExistingSandboxPath(
  requestedPath
) {
  await ensureSandboxExists();

  let canonicalSandboxRoot;
  let canonicalRequestedPath;

  try {
    // Resolve both sides so comparisons use actual filesystem paths.
    canonicalSandboxRoot = await fs.realpath(
      SANDBOX_ROOT
    );

    canonicalRequestedPath = await fs.realpath(
      requestedPath
    );
  } catch (error) {
    // Do not leak unnecessary internal filesystem details for
    // a normal missing-file condition.
    if (error?.code === "ENOENT") {
      throw new Error("File not found.");
    }

    throw error;
  }

  // Perform the containment check again after following symlinks.
  if (
    !isPathInside(
      canonicalSandboxRoot,
      canonicalRequestedPath
    )
  ) {
    throw new Error(
      "Requested file is outside the allowed sandbox."
    );
  }

  return {
    canonicalSandboxRoot,
    canonicalRequestedPath,
  };
}