# cherry-pick 🍒⛏📦

Build tool to generate proxy directories with `package.json` files such as this:

```json
{
  "name": "redux-saga/effects",
  "private": true,
  "main": "../lib/effects.js",
  "module": "../es/effects.js"
}
```

## Why?

When it comes to "main" entry points of our libraries we have an _easy_ way for
supporting both CJS & ESM files with respectively `"main"` and `"module"` fields
in `package.json`. This allows resolution algorithms to chose a file with the
best format _automatically_. However if we have multiple files in a package and
we want all of them to be importable we often suggest to users doing it like
this:

```js
import module from "package/lib/module";
```

There are problems with this approach:

* it is often encouraging people to import files authored in CJS format, which
  if produced with tools like [`babel`](https://github.com/babel/babel) has i.e.
  interop helper functions deoptimizing imported file size when comparing to the
  same file authored in ESM format. Also `webpack` just bails out on CJS files
  when trying to optimize your application size with techniques such as
  tree-shaking & scope hoisting (a.k.a module concatenation).
* it is exposing **internal directory structure** to the user. Why `lib` is in
  the requested path? If you ship both CJS & ESM directories to `npm` and if
  users would like to import appropriate file depending on the tool they are
  "forced" to remember this and switch between importing the same thing with
  paths like `package/lib/module` and `package/es/module`. This is a mental
  overhead that can be avoided.

This technique was also described by me in more details in
[this article](https://developers.livechatinc.com/blog/how-to-create-javascript-libraries-in-2018-part-2#proxy-directories).

## CLI Options

### default

```
cherry-pick [input-dir]

Create proxy directories

Commands:
  cherry-pick [input-dir]        Create proxy directories              [default]
  cherry-pick clean [input-dir]  Cleanup generated directories

Options:
  --help, -h     Show help                                             [boolean]
  --version, -v  Show version number                                   [boolean]
  --cjs-dir                                                     [default: "lib"]
  --esm-dir                                                      [default: "es"]
  --types-dir
  --cwd                                                           [default: "."]
  --input-dir                                                   [default: "src"]
```

### clean

```
cherry-pick clean [input-dir]

Cleanup generated directories

Options:
  --help, -h     Show help                                             [boolean]
  --version, -v  Show version number                                   [boolean]
  --cwd                                                           [default: "."]
  --input-dir                                                   [default: "src"]
```

## JS API

`cherry-pick` exports a `default` method which creates proxy directories and
`clean` which removes them. Both accepts the same options as corresponding CLI
commands, only they are camelCased.

```js
const { default: cherryPick, clean } = require("cherry-pick");

cherryPick({ inputDir: "source" })
  .then(cherryPicked =>
    console.log(`Created proxy directories: ${cherryPicked.join(", ")}`)
  )
  .then(() => clean({ inputDir: "source" }))
  .then(removed =>
    console.log(`Removed proxy directories: ${Removed.join(", ")}`)
  );
```
