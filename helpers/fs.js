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
// Get one file info object

const getFileData = async (path, name, expandedDirs) => {
  const stats = await stat(resolve(path, name));
  const isDir = stats.isDirectory();
  return {
    name,
    path,
    id: stats.ino,
    isDir,
    isExpanded: isDir && expandedDirs.has(stats.ino),
    children: null,
  };
};

//------------------------------------------------------------------------------
// Get an array of children file objects

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
// Get the tree of file objects

const getTreeData = async (tree) => {
  const expandedDirs = new Set(tree.expandedDirs);
  const children = await getChildren('.', tree.root, expandedDirs);
  return { ...tree, children };
};

//------------------------------------------------------------------------------

module.exports = getTreeData;
