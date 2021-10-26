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

const getFileData = async (path, name, expandedDirs, expand = false) => {
  const stats = await stat(resolve(path, name));
  const isDir = stats.isDirectory();
  const isExpanded = expand ? true : isDir && expandedDirs.has(stats.ino);
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

const getChildren = async (path, name, expandedDirs) => {
  const dirPath = resolve(path, name);
  const childrenNames = await readdir(dirPath);

  const children = [];
  for (const childName of childrenNames) {
    const fileInfo = await getFileData(dirPath, childName, expandedDirs);

    if (fileInfo.isDir && fileInfo.isExpanded) {
      fileInfo.children = await getChildren(dirPath, childName, expandedDirs);
    }
    children.push(fileInfo);
  }

  return children.sort(sortFiles);
};

//------------------------------------------------------------------------------
// Get a tree of file objects

const getTree = async (root) => {
  const expandedDirs = new Set(root.expandedDirs);
  const expand = true;

  const tree = await getFileData(root.path, root.name, expandedDirs, expand);
  tree.children = await getChildren(root.path, root.name, expandedDirs);

  return tree;
};

//------------------------------------------------------------------------------
// Get an array of trees

const getTrees = async (roots) => {
  const trees = [];
  for (const root of roots) {
    const tree = await getTree(root);
    trees.push(tree);
  }
  return trees;
};

//------------------------------------------------------------------------------

module.exports = getTrees;
