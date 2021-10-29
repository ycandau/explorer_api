//------------------------------------------------------------------------------
// Using the Promises API for file system operations

const { stat, readdir } = require('fs/promises');
const { resolve } = require('path');

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

const getFileData = async (name, path, depth, expandedDirs) => {
  const stats = await stat(path);
  const isDir = stats.isDirectory();
  const isExpanded = isDir && expandedDirs.has(stats.ino);

  return {
    name,
    path,
    depth,
    id: stats.ino,
    isDir,
    isExpanded,
  };
};

//------------------------------------------------------------------------------
// Collect the children of a directory into the files array

const collectChildren = async (files, path, depth, expandedDirs) => {
  const childrenNames = await readdir(path);

  // First pass to get all the children and sort them
  const children = [];
  for (const name of childrenNames) {
    const fullPath = resolve(path, name);
    const child = await getFileData(name, fullPath, depth, expandedDirs);
    children.push(child);
  }
  children.sort(sortFiles);

  // Second pass to collect and recurse as needed
  for (const child of children) {
    files.push(child);

    if (child.isDir && child.isExpanded) {
      await collectChildren(files, child.path, depth + 1, expandedDirs);
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

const getTree = async (root) => {
  const files = [];
  const isExpanded = root.expandedDirs.size !== 0;

  // Push root first
  const rootFile = {
    name: root.name,
    path: root.path,
    depth: 0,
    id: root.id,
    isDir: true,
    isExpanded,
  };
  files.push(rootFile);

  // Collect children
  if (isExpanded) {
    await collectChildren(files, root.path, 1, root.expandedDirs);
  }

  // Set indexes
  addIndexes(files);

  return { files };
};

//------------------------------------------------------------------------------
// Get an array of trees

const getTrees = async (roots) => {
  const trees = [];
  const errors = [];

  for (const root of roots.values()) {
    try {
      const tree = await getTree(root);
      trees.push(tree);
    } catch (err) {
      // Happens if a root folder is deleted: Delete the root
      roots.delete(root.id);
    }
  }

  return { trees, errors };
};

//------------------------------------------------------------------------------

module.exports = getTrees;
