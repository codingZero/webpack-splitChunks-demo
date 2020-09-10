const HTMLWebpackPlugin = require("html-webpack-plugin")
const {CleanWebpackPlugin} = require("clean-webpack-plugin")
module.exports = {
  entry: {
    pageB: "./src/pageB.js",
    pageA: "./src/pageA.js",
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      minChunks: 1,
      minSize: 0,
      maxAsyncRequests: 3,
      maxInitialRequests: 3,
      automaticNameDelimiter: "~",
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HTMLWebpackPlugin({
      excludeChunks: ["pageB"]
    })
  ]
}
