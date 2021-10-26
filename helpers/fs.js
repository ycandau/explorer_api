// @todo:

//------------------------------------------------------------------------------
// Using the Promises API for file system operations
// And chokidar as file watcher

const { stat, readdir } = require('fs/promises');
const { resolve } = require('path');
const chokidar = require('chokidar');

//------------------------------------------------------------------------------
// Sorting function for file info objects

const sortFiles = (f1, f2) => {
  if (f1.isDir === f2.isDir) {
    return f1.name.localeCompare(f2.name);
  } else {
    return f2.isDir - f1.isDir;
  }
};

//------------------------------------------------------------------------------
// Get one file data object

const getFileData = async (path, name, expandedDirs, expand = false) => {
  const stats = await stat(resolve(path, name));
  const isDir = stats.isDirectory();
  // const isExpanded = expand ? true : isDir && expandedDirs.has(stats.ino);
  const isExpanded = true;
  return {
    name,
    path,
    id: stats.ino,
    isDir,
    isExpanded,
    children: null,
  };
};

//------------------------------------------------------------------------------
// Get an array of children

const getChildren = async (path, name, expandedDirs, watched) => {
  const dirPath = resolve(path, name);
  const childrenNames = await readdir(dirPath);

  const children = [];
  for (const childName of childrenNames) {
    const fileData = await getFileData(dirPath, childName, expandedDirs);

    if (fileData.isDir && fileData.isExpanded) {
      watched.set(fileData.id, resolve(fileData.path, fileData.name));
      fileData.children = await getChildren(dirPath, childName, expandedDirs);
    }
    children.push(fileData);
  }

  return children.sort(sortFiles);
};

//------------------------------------------------------------------------------
// Get a tree of file objects

const getTree = async (root, watched) => {
  const expandedDirs = new Set(root.expandedDirs);
  const expand = true;

  const tree = await getFileData(root.path, root.name, expandedDirs, expand);
  tree.children = await getChildren(
    root.path,
    root.name,
    expandedDirs,
    watched
  );

  watched.set(tree.id, resolve(tree.path, tree.name));

  return tree;
};

//------------------------------------------------------------------------------
// Get an array of trees

const getTrees = async (roots) => {
  const trees = [];
  const errors = [];
  const watched = new Map(); // Use map to avoid redundant watchers

  for (const root of roots) {
    try {
      const tree = await getTree(root, watched);
      trees.push(tree);
    } catch (err) {
      errors.push({ ...err, type: 'tree' });
      console.error(err);
    }
  }

  const watchPaths = [...watched.values()];
  watcher.add(watchPaths);

  return { trees, errors };
};

//------------------------------------------------------------------------------
// File watcher

const setupWatcher = () => {
  const watcher = chokidar.watch();

  watcher
    .on('add', (path) => console.log(`Add: ${path}`))
    .on('change', (path) => console.log(`Change: ${path}`))
    .on('unlink', (path) => console.log(`Remove: ${path}`))
    .on('addDir', (path) => console.log(`Add dir: ${path}`))
    .on('unlinkDir', (path) => console.log(`Remove dir: ${path}`))
    .on('error', (err) => console.error(err.message));

  return watcher;
};

const watcher = setupWatcher();

//------------------------------------------------------------------------------

module.exports = getTrees;
