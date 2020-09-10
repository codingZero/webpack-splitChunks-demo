let pageA = {
  name: "pageA",
  path: "./src/pageA",
  size: 4792,
  type: "entry"
}

let pageB = {
  name: "pageB",
  path: "./src/pageB",
  size: 2313,
  type: "entry"
}

let react = {
  name: "React",
  path: "/node_modules/React",
  size: 409600,
  type: "other"
}

let async1 = {
  name: "async1",
  path: "./src/async1",
  size: 4351,
  type: "dynamic"
}

let async2 = {
  name: "async2",
  path: "./src/async2",
  size: 1034,
  type: "dynamic"
}

let util = {
  name: "util",
  path: "./src/util",
  size: 80,
  type: "other"
}

let common = {
  name: "common",
  path: "./src/common",
  size: 50,
  type: "other"
}

let chunkList = [
  {
    name: "pageA",
    modules: [pageA, react, common, util],
    type: "initial"
  },
  {
    name: "async1",
    modules: [async1],
    type: "async"
  },
  {
    name: "pageB",
    modules: [pageB, util],
    type: "initial",
  },
  {
    name: "async2",
    modules: [async2, common],
    type: "async"
  }
]

let splitChunks = require("../webpack.config").optimization.splitChunks;



let fileList = [];

// 遍历所有chunk
function traversalChunk() {
  chunkList.forEach(chunk => {
    if (getIsMatch(chunk)) traversalModule(chunk);
  });
}

// 判断 chunk 是否匹配
function getIsMatch(chunk) {
  let chunks = splitChunks.chunks;
  if (typeof chunks === "function") {
    return chunks(chunk)
  }
  if (chunks === "all") return true;
  return chunk.type === chunks;
}

// 将 cacheGroups 按权重进行排序
function getGroups() {
  let tempGroups = splitChunks.cacheGroups;
  let {minSize, minChunks} = splitChunks;
  let cacheGroups = Object.keys(tempGroups).map(key => {
    let group = tempGroups[key];
    return {name: key, minSize, minChunks, ...group}
  });
  cacheGroups.sort((g1, g2) => g2.priority - g1.priority)
  return cacheGroups;
}

// 遍历 chunk 中所有模块
function traversalModule(chunk) {
  let modules = chunk.modules;
  modules.sort((m1, m2) => m2.size - m1.size)
  let cacheGroups = getGroups();
  for (let module of modules) {
    if (["entry", "dynamic"].includes(module.type))continue;
    for (let group of cacheGroups) {
      if (group.test) {
        let b = group.test.test(module.path)
        if (!b) continue;
      }
      if (module.size >= group.minSize) {
        traversalOtherChunk(chunkList, chunk, module, group)
      }
    }
  }
}


// 查看其他 chunk 是否引用
function traversalOtherChunk(chunkList, currentChunk, module, group) {
  let chunkNameList = [currentChunk.name];
  for (let chunk of chunkList) {
    if (chunk === currentChunk) continue;
    if (!getIsMatch(chunk)) continue;
    let modules = chunk.modules;
    let m = modules.find(item => item.name === module.name);
    if (m) chunkNameList.push(chunk.name)
  }
  if (chunkNameList.length >= group.minChunks) {
    chunkNameList.sort();
    chunkNameList.unshift(group.name);
    let fileName = chunkNameList.join(splitChunks.automaticNameDelimiter)
    canSplit(fileName, currentChunk, module, group)
  }
}

// 判断是否允许分离
function canSplit(fileName, currentChunk, module) {
  let file = fileList.find(file => file.name === fileName);
  if (file) {
    if (!file.content.includes(module.name)) {
      file.content.push(module.name) // 模拟文件写入
    }
  } else {
    let delimiter = splitChunks.automaticNameDelimiter
    let relativeCount = getFileCount(currentChunk);
    let {maxAsyncRequests, maxInitialRequests} = splitChunks;
    let max = currentChunk.type === "async" ? maxAsyncRequests : maxInitialRequests;
    if (relativeCount + 1 < max) {
      let chunkNameList = fileName.split(delimiter);
      chunkNameList.shift();
      for (let chunkName of chunkNameList) {
        if (chunkName === currentChunk.name) continue;
        if (isOverflow(chunkName)) return;
      }
      fileList.push({
        name: fileName,
        content: [module.name]
      })
    }
  }
}

// 获取与 chunk 相关文件的数量
function getFileCount(chunk) {
  let delimiter = splitChunks.automaticNameDelimiter
  let relativeFileList = fileList.filter(file => {
    let chunkNameList = file.name.split(delimiter);
    chunkNameList.shift();
    return chunkNameList.includes(chunk.name);
  });
  return relativeFileList.length;
}

// 判断与它共同导入模块的 chunk 分离数是否达到上限
function isOverflow(chunkName) {
  let chunk = chunkList.find(chunk => chunk.name === chunkName);
  let {maxAsyncRequests, maxInitialRequests} = splitChunks;
  let max = chunk.type === "async" ? maxAsyncRequests : maxInitialRequests;
  return getFileCount(chunk) >= max;
}

traversalChunk();
console.log(fileList)
