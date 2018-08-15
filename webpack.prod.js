const merge = require('webpack-merge');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlCriticalWebpackPlugin = require('html-critical-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const common = require('./webpack.common.js');

const devMode = false;

module.exports = merge(common, {
    mode: 'production',
    optimization: {
        minimize: true,
        minimizer: [
            new UglifyJsPlugin({
                cache: true,
                parallel: true,
                sourceMap: false
                // include: /\.min\.js$/
            }),
            new OptimizeCSSAssetsPlugin({})
        ]
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: './**/*.json',
                to: '.',
                flatten: true,
                context: './app/'
            }
        ]),
        new CopyWebpackPlugin([
            {
                from: './img/icons/*',
                to: './img/icons',
                flatten: true,
                context: './app/'
            }
        ]),
        new HtmlCriticalWebpackPlugin({
            base: 'dist',
            src: 'index.html',
            dest: 'index.html',
            inline: true,
            minify: true,
            extract: true,
            width: 411,
            height: 823,
            penthouse: {
                blockJSRequests: false,
            }
        }),
        new HtmlCriticalWebpackPlugin({
            base: 'dist',
            src: 'restaurant.html',
            dest: 'restaurant.html',
            inline: true,
            minify: true,
            extract: true,
            width: 411,
            height: 823,
            penthouse: {
                blockJSRequests: false,
            }
        }),
        new InjectManifest({
            swDest: 'sw.js',
            swSrc: './app/sw.src.js',
            exclude: [/\.png$/, /\.LICENSE$/, '_redirects']
        }),
        new UglifyJsPlugin({
            test: /\.js$/,
            cache: true,
            sourceMap: devMode,
            extractComments: !devMode
        })
    ]
});
