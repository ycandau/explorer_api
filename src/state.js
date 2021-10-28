const { resolve } = require('path');
const { stat } = require('fs/promises');
const chokidar = require('chokidar');

//------------------------------------------------------------------------------

const newRoots = () => {
  const roots = new Map();
  const watchedFiles = new Map();
  const watcher = chokidar.watch();

  watcher
    .on('add', (path) => console.log(`Add: ${path}`))
    .on('change', (path) => console.log(`Change: ${path}`))
    .on('unlink', (path) => console.log(`Remove: ${path}`))
    .on('addDir', (path) => console.log(`Add dir: ${path}`))
    .on('unlinkDir', (path) => console.log(`Remove dir: ${path}`))
    .on('error', (err) => console.error(err.message));

  return { roots, watchedFiles, watcher };
};

//------------------------------------------------------------------------------

const addRoot = async (roots, path) => {
  const resolvedPath = resolve(path);
  const stats = await stat(resolvedPath);

  const expandedDirs = new Map();
  expandedDirs.set(stats.ino, resolvedPath);

  const root = {
    name: basename(resolvedPath),
    path: resolvedPath,
    rootId: stats.ino,
    expandedDirs,
  };
  roots.set(root);
};

//------------------------------------------------------------------------------

const updateExpanded = (roots, rootId, expandedDirs) => {
  const root = roots.get(rootId);
  root.expandedDirs = expandedDirs.reduce((map, { fileId, path }) => {
    map.set(fileId, path);
    return map;
  }, new Map());
};

//------------------------------------------------------------------------------

const getFilesToWatch = (roots) => {
  const filesToWatch = new Map();
  for (const root of roots.values()) {
    for (const [id, path] of root.expandedDirs) {
      filesToWatch.set(id, path);
    }
  }
  return filesToWatch;
};

//------------------------------------------------------------------------------

const updateFilesWatched = (roots, filesToWatch) => {
  for (const [id, path] of roots.watchedFiles) {
    if (!filesToWatch.has(id)) {
      roots.watcher.unwatch(path); // async
    }
  }
  for (const [id, path] of filesToWatch) {
    if (!roots.watchedFiles.has(id)) {
      roots.watcher.add(path);
    }
  }
  roots.watchedFiles = filesToWatch;
};

//------------------------------------------------------------------------------
