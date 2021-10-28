const { resolve, basename } = require('path');
const { stat } = require('fs/promises');
const chokidar = require('chokidar');

//------------------------------------------------------------------------------
// Initialize the state

// root:        { name, path, id, expandedDirs: map<id, path> }
// roots:       map<id, root>
// watchedDirs: map<id, path>

const initState = async (paths) => {
  const roots = new Map();
  let watchedDirs = new Map();
  const watcher = chokidar.watch();

  watcher
    .on('add', (path) => console.log(`Add: ${path}`))
    .on('change', (path) => console.log(`Change: ${path}`))
    .on('unlink', (path) => console.log(`Remove: ${path}`))
    .on('addDir', (path) => console.log(`Add dir: ${path}`))
    .on('unlinkDir', (path) => console.log(`Remove dir: ${path}`))
    .on('error', (err) => console.error(err.message));

  // Add roots from the command line arguments
  for (const path of paths) {
    await addRoot(roots, path);
  }

  const dirsToWatch = getDirsToWatch(roots);
  watchedDirs = updateDirsWatched(watchedDirs, dirsToWatch, watcher);

  return { roots, watchedDirs, watcher };
};

//------------------------------------------------------------------------------
// Add a root

const addRoot = async (roots, path) => {
  const resolvedPath = resolve(path);
  const stats = await stat(resolvedPath);
  const expandedDirs = new Map([[stats.ino, resolvedPath]]);

  const root = {
    name: basename(resolvedPath),
    path: resolvedPath,
    id: stats.ino,
    expandedDirs,
  };
  roots.set(stats.ino, root);
};

//------------------------------------------------------------------------------
// Update the map of expanded directories for one root

const updateExpanded = (roots, rootId, expandedDirs) => {
  const root = roots.get(rootId);
  root.expandedDirs = new Map(expandedDirs);
};

//------------------------------------------------------------------------------
// Get a map of all directories to watch from all roots

const getDirsToWatch = (roots) => {
  const dirsToWatch = new Map();
  for (const root of roots.values()) {
    for (const [fileId, path] of root.expandedDirs) {
      dirsToWatch.set(fileId, path);
    }
  }
  return dirsToWatch;
};

//------------------------------------------------------------------------------
// Update the watcher based on the differences in directories to watch

const updateDirsWatched = (watchedDirs, dirsToWatch, watcher) => {
  for (const [fileId, path] of watchedDirs) {
    if (!dirsToWatch.has(fileId)) {
      watcher.unwatch(path); // async
      // console.log(`-- Unwatching: ${path}`);
    }
  }
  for (const [fileId, path] of dirsToWatch) {
    if (!watchedDirs.has(fileId)) {
      watcher.add(path);
      // console.log(`-- Watching:   ${path}`);
    }
  }
  return dirsToWatch;
};

//------------------------------------------------------------------------------

module.exports = { initState };
