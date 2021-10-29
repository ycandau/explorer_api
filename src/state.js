const { resolve, basename } = require('path');
const { stat } = require('fs/promises');
const chokidar = require('chokidar');

const getTrees = require('./fs');

// root:        { name, path, id, expandedDirs: map<id, path> }
// roots:       map<id, root>
// watchedDirs: map<id, path>

//------------------------------------------------------------------------------
// Initialize the state

const initState = async (paths, wss) => {
  const roots = new Map();
  const watcher = newWatcher(roots, wss);
  const watchedDirs = new Map();

  const state = { roots, watcher, watchedDirs };

  for (const path of paths) {
    await addRoot(state, path);
  }

  return state;
};

//------------------------------------------------------------------------------
// Set the watcher event handlers

const WebSocket = require('ws');

const newWatcher = (roots, wss) => {
  const updateHandler = () => {
    wss.clients.forEach(async (client) => {
      if (client.readyState === WebSocket.OPEN) {
        const data = await getTrees(roots);
        client.send(JSON.stringify(data));
      }
    });
  };

  return chokidar
    .watch()
    .on('add', updateHandler)
    .on('unlink', updateHandler)
    .on('change', updateHandler)
    .on('addDir', updateHandler)
    .on('unlinkDir', updateHandler)
    .on('error', (err) => console.error(err.message));
};

//------------------------------------------------------------------------------
// Add a root

const addRoot = async (state, path) => {
  try {
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
  } catch (err) {
    console.error(err.message);
  }
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
      await state.watcher.unwatch(path); // async
      // console.log(`-- Unwatching: ${glob}`);
    }
  }
  for (const [fileId, path] of dirsToWatch) {
    if (!state.watchedDirs.has(fileId)) {
      state.watcher.add(path);
      // console.log(`++ Watching: ${path}`);
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

  console.log(state.watcher.getWatched());
};

//------------------------------------------------------------------------------

module.exports = { initState, updateRoot };
