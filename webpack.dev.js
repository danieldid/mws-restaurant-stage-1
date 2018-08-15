const merge = require('webpack-merge');
const DashboardPlugin = require("webpack-dashboard/plugin");
const common = require("./webpack.common.js");

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist',
        port: 8080,
        quiet: true,
        watchContentBase: true
    },
    plugins: [
        new DashboardPlugin()
    ]
});
