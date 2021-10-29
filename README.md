# File explorer API

- [About](#about)
- [Installation](#installation)
- [Implementation and choices](#implementation-and-choices)
- [Notes](#notes)
- [Things to improve](#things-to-improve)
- [Issues](#issues)
- [Dependencies](#dependencies)
- [Development dependencies](#development-dependencies)

---

## About

This repository contains the API for a **file explorer** component. The server is built with [Node.js](https://nodejs.org/) and [Express](https://expressjs.com/). It serves file lists to the frontend application and establishes a WebSocket connection to update the client on any file changes.

---

## Installation

Clone the repository with [git](https://git-scm.com/):

```shell
git clone git@github.com:ycandau/explorer_api.git
```

Change directory to the root of the repository:

```shell
cd explorer_api
```

Install all the dependencies with [yarn](https://classic.yarnpkg.com/en/):

```shell
yarn install
```

Set the local environment variables in the `.env` file:

```shell
PORT=8000
```

Run the server with any number of arguments to indicate which folders should be explored. A set of demonstration folders is included in the repository:

```shell
node .\file-explorer.js .
node .\file-explorer.js . ./dirs ./dirs/dir1 ./dirs/dir2 ./dirs/dir3
```

The server works with a React frontend application found [here](https://github.com/ycandau/explorer). Start the server before starting the frontend app.

---

## Implementation and choices

### File watcher

I first looked into the native Node.js solutions: `fs.watch()` and `fs.watchFile()`. The official documentation highlights a lot of caveats. And based on further readings it seems like using these directly is far from optimal (duplicated events, differences between platforms...). I thus chose the **chokidar** library which comes recommended by many, has few dependencies, and is actually the solution adopted by VS Code.

### General approach

We can avoid the brute force approach of fully recursing through the folder structure by keeping track of which folders are expanded and which are collapsed. Essentially, we don't need to know what is inside collapsed folders until we expand them. This has many advantages:

- We can limit file system accesses.
- We can send less data.
- We can maintain fewer watchers.

### Server state

To implement this approach the server needs to keep track of the following:

- `roots`

A map of root objects, each of which includes:

```javascript
const root = {
  name, // The basename of the folder
  path, // The resolved path of the folder
  id, // The index node of the folder as a unique identifier
  expandedDirs, // A map of expanded directories
};
```

We create and update one such object for each of the directory sections of the component, based on the initial arguments provided through the command line.

- `watcher`
- `watchedDirs`

We create a chokidar `watcher` and use it to non-recursively watch the list of expanded folders. The map `watchedDirs` tracks all the directories that are watched at a given point. It is aggregated from the `expandedDirs` of all the roots. We need these two levels of data structure (per root and for all roots) because the same folder could be part of two different roots.

As the user expands and collapses folders in the component, the client sends updates to the server in the form of a root object with a new list of `expandedDirs`.

The server then:

- updates the corresponding root,
- compiles a new map of directories to be watched,
- calculates the difference between the current map and the new map,
- adds and removes directories from the `watcher` based on this difference.

### Data format

To send data to the client I initially considered two formats:

- Nested objects that parallel the folder structure.
- Arrays aggregated by traversing the tree structure of the folders.

Formatting the data as a list is going to be necessary for the eventual rendering on the client. So I decided to aggregate the arrays directly on the server. Due to React's use of immutable state data, arrays are also going to be easier to work with than potentially deeply nested objects.

The server creates and sends a list of file objects for each root with the following information:

```javascript
const fileObject = {
  name, // The basename of the file
  path, // The resolved path of the file
  depth, // The depth in the folder tree structure
  id, // The index node of the file
  isDir, // Whether the file is a directory
  isExpanded, // Whether the file is expanded
  index, // The index in the array
  nextNonChild, // For folders: The index of the next element that is not a child
};
```

The tree traversal thus keeps some information for later use such as the depth. For folders we also compute the indexes of the next entries that are not children. We can do this in linear time and it makes it easy on the client side to skip over a folder when we collapse it.

Sorting is done at each folder level during the tree traversal, by directory versus non-directory status first, and alphabetical order second.

---

## Notes

For file system access I used the [promise API](https://nodejs.org/docs/latest-v16.x/api/fs.html#promises-api) and `async`/`await` syntax for more readable code.

In terms of programming style I have adopted a functional approach rather than JavaScript's version of object-oriented programming (overlaid over the language's prototypical inheritance).

---

## Things to improve

With more time I would implement data fetching and receiving with the [stream](https://nodejs.org/docs/latest-v16.x/api/stream.html) library.

The server could also be improved by doing per root updates rather than always for all roots.

---

## Issues

I used inodes as unique identifiers for the files, roots and trees. After double checking I think uniqueness is only guaranteed per file device. So the unique ids should be changed to a combination of the `ino` and `dev` properties returned by `fs.stat()`.

Adding and removing the files watched by the chokidar watcher does not seem to work exactly as intended. Globbing patterns apparently work differently on Windows platforms. This is something I need to experiment further with.

Possibly related to the previous point, there seems to be an issue when accessing parent folders of the repository.

---

## Dependencies

- [Express](https://expressjs.com/): Fast, unopinionated, minimalist web framework for Node.js.
- [chokidar](https://github.com/paulmillr/chokidar): Minimal and efficient cross-platform file watching library.
- [ws](https://github.com/websockets/ws): WebSocket client and server implementation.
- [morgan](https://github.com/expressjs/morgan): HTTP request logger middleware for Node.js.
- [dotenv](https://github.com/motdotla/dotenv): Zero-dependency module that loads environment variables.

---

## Development dependencies

- [nodemon](https://github.com/remy/nodemon): Automatic restart of node application on file changes.
