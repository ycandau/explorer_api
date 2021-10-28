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

const getFileData = async (path, name, depth, expandedDirs, expand = false) => {
  const stats = await stat(resolve(path, name));
  const isDir = stats.isDirectory();
  // const isExpanded = expand ? true : isDir && expandedDirs.has(stats.ino);
  const isExpanded = isDir;

  return {
    name,
    path,
    depth,
    ino: stats.ino,
    isDir,
    isExpanded,
  };
};

//------------------------------------------------------------------------------
// Collect the children files of a directory into the files array

const collectChildren = async (
  files,
  path,
  name,
  depth,
  expandedDirs,
  watched
) => {
  const dirPath = resolve(path, name);
  const childrenNames = await readdir(dirPath);

  // First pass to get all children and sort
  const children = [];
  for (const childName of childrenNames) {
    const child = await getFileData(dirPath, childName, depth, expandedDirs);
    children.push(child);
  }
  children.sort(sortFiles);

  // Second pass to recurse and expand as needed
  for (const child of children) {
    files.push(child);

    if (child.isDir && child.isExpanded) {
      // Watchers
      watched.set(child.ino, resolve(child.path, child.name));

      // Children
      await collectChildren(
        files,
        dirPath,
        child.name,
        depth + 1,
        expandedDirs
      );
    }
  }
};

//------------------------------------------------------------------------------
// Add indexes and next non-child indexes

const addIndexes = (files) => {
  let prevDepth = 0;
  const stack = []; // Stack of indexes and depths for expanded directories

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    file.index = i;

    // Stack the indexes and depths of expanded directories
    if (file.depth > prevDepth) {
      stack.push({ index: i - 1, depth: prevDepth });
    }

    // Set the indexes of next non-child files, so we can skip as needed
    if (file.depth < prevDepth) {
      while (stack[stack.length - 1].depth >= file.depth) {
        const prev = stack.pop();
        files[prev.index].nextNonChild = i;
      }
    }
    prevDepth = file.depth;
  }

  // Unstack remaining
  while (stack.length) {
    const { index } = stack.pop();
    files[index].nextNonChild = files.length;
  }
};

//------------------------------------------------------------------------------
// Get a tree of file objects

const getTree = async (root, watched) => {
  const expandedDirs = new Set(root.expandedDirs);
  const expand = true; // expand root directory
  const files = [];

  // Root
  const rootFile = await getFileData(
    root.path,
    root.name,
    0,
    expandedDirs,
    expand
  );
  files.push(rootFile);

  // Children
  await collectChildren(files, root.path, root.name, 1, expandedDirs, watched);

  // Watchers
  watched.set(rootFile.ino, resolve(rootFile.path, rootFile.name));

  addIndexes(files);

  return { files };
};

//------------------------------------------------------------------------------
// Get an array of trees

const getTrees = async (roots) => {
  const trees = [];
  const errors = [];
  const watched = new Map(); // Use map to avoid redundant watchers

  try {
    for (const root of roots) {
      const tree = await getTree(root, watched);
      trees.push(tree);
    }
  } catch (err) {
    errors.push({ ...err, type: 'tree' });
    console.error(err);
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
