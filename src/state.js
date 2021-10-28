const { resolve, basename } = require('path');
const { stat } = require('fs/promises');
const chokidar = require('chokidar');

// root:        { name, path, id, expandedDirs: map<id, path> }
// roots:       map<id, root>
// watchedDirs: map<id, path>

//------------------------------------------------------------------------------
// Initialize the state

const initState = async (paths) => {
  const state = {
    roots: new Map(),
    watcher: newWatcher(),
    watchedDirs: new Map(),
  };

  for (const path of paths) {
    await addRoot(state, path);
  }

  return state;
};

//------------------------------------------------------------------------------
// Set the watcher event handlers

const newWatcher = () => {
  return chokidar
    .watch()
    .on('add', (path) => 0)
    .on('change', (path) => 0)
    .on('unlink', (path) => 0)
    .on('addDir', (path) => 0)
    .on('unlinkDir', (path) => 0)
    .on('error', (err) => 0);

  // .on('add', (path) => console.log(`Add: ${path}`))
  // .on('change', (path) => console.log(`Change: ${path}`))
  // .on('unlink', (path) => console.log(`Remove: ${path}`))
  // .on('addDir', (path) => console.log(`Add dir: ${path}`))
  // .on('unlinkDir', (path) => console.log(`Remove dir: ${path}`))
  // .on('error', (err) => console.error(err.message));
};

//------------------------------------------------------------------------------
// Add a root

const addRoot = async (state, path) => {
  const resolvedPath = resolve(path);
  const stats = await stat(resolvedPath);

  const root = {
    name: basename(resolvedPath),
    path: resolvedPath,
    id: stats.ino,
    expandedDirs: new Map([[stats.ino, resolvedPath]]),
  };

  state.roots.set(stats.ino, root);
  await updateDirsWatched(state);
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

const updateDirsWatched = async (state) => {
  const dirsToWatch = getDirsToWatch(state.roots);

  // Watch and unwatch based on difference
  for (const [fileId, path] of state.watchedDirs) {
    if (!dirsToWatch.has(fileId)) {
      const glob = resolve(path, '*');
      await state.watcher.unwatch(glob); // async
      // console.log(`-- Unwatching: ${glob}`);
    }
  }
  for (const [fileId, path] of dirsToWatch) {
    if (!state.watchedDirs.has(fileId)) {
      state.watcher.add(path);
      // console.log(`++ Watching:   ${path}`);
    }
  }
  state.watchedDirs = dirsToWatch;
};

//------------------------------------------------------------------------------
// Update the map of expanded directories for one root

const updateRoot = async (state, newRoot) => {
  const root = state.roots.get(newRoot.id);
  root.expandedDirs = new Map(newRoot.expandedDirs);
  await updateDirsWatched(state);
};

//------------------------------------------------------------------------------

module.exports = { initState, updateRoot };
