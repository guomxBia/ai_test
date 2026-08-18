// server/stdio_mcp/tools/file-tools.js
//
// Filesystem MCP tool implementations.
//
// Responsibilities:
// - Read files from local_data.
// - List local_data.
//
// Security/path-containment logic belongs in ../lib/sandbox.js.

import fs from "fs/promises";
import path from "path";

import {
  SANDBOX_ROOT,
  ensureSandboxExists,
  resolveSandboxPath,
  resolveSafeExistingSandboxPath,
} from "../lib/sandbox.js";

/**
 * MCP tool: read_local_file
 *
 * Read a UTF-8 text file from the local_data sandbox.
 *
 * Security is handled in two stages:
 *
 * 1. resolveSandboxPath() prevents ordinary ../ traversal.
 * 2. resolveSafeExistingSandboxPath() resolves symbolic links and
 *    confirms the final target still belongs to the sandbox.
 */
export async function handleReadLocalFile({ fileName } = {}) {
  await ensureSandboxExists();

  // Validate the user-provided relative path before touching
  // the requested filesystem object.
  const requestedPath = resolveSandboxPath(fileName);

  // Resolve symlinks and verify that the real target remains
  // inside local_data.
  const {
    canonicalSandboxRoot,
    canonicalRequestedPath,
  } = await resolveSafeExistingSandboxPath(requestedPath);

  // Do not allow directories, pipes, devices, etc. to be read
  // through this tool.
  const stats = await fs.stat(canonicalRequestedPath);

  if (!stats.isFile()) {
    throw new Error("Requested path is not a regular file.");
  }

  const content = await fs.readFile(
    canonicalRequestedPath,
    "utf8"
  );

  return {
    // Never expose the server's absolute filesystem path.
    fileName: path.relative(
      canonicalSandboxRoot,
      canonicalRequestedPath
    ),

    content,
  };
}

/**
 * MCP tool: list_local_directory
 *
 * List only the direct children of local_data.
 *
 * The operation intentionally does not recurse into child directories.
 * This keeps the result bounded and avoids unnecessarily exposing an
 * entire directory tree.
 */
export async function handleListLocalDirectory() {
  await ensureSandboxExists();

  // withFileTypes gives us type information without requiring
  // a separate fs.stat() call for every entry.
  const entries = await fs.readdir(SANDBOX_ROOT, {
    withFileTypes: true,
  });

  const items = entries
    .map((entry) => ({
      name: entry.name,

      type: entry.isDirectory()
        ? "directory"
        : entry.isFile()
          ? "file"
          : "other",
    }))

    // Stable ordering makes tests and client display predictable.
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    // Return the logical sandbox name rather than its absolute path.
    folder: "local_data",
    items,
  };
}