import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HtmlMinimizerPlugin from 'html-minimizer-webpack-plugin';
import RemovePlugin from 'remove-files-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
	entry: {
		'index.tmp': './static/index.html',
		'js/main.js': './static/js/main.js',
		'css/main': './static/css/main.css',
		'pages/about.tmp': './static/pages/about.md',
		'pages/home.tmp': './static/pages/home.md',
		'pages/site.tmp': './static/pages/site.md',
		'pages/blog.tmp': './static/pages/blog.md',
		'pages/blog/php-foreach-by-reference-considered-harmful.tmp': './static/pages/blog/php-foreach-by-reference-considered-harmful.md',
	},
	output: {
		filename: (pathData) => pathData.chunk.name,
		path: path.resolve(__dirname, 'dist'),
		clean: true,
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: "static/assets", to: "assets" },
			],
		}),
		new RemovePlugin({
			after: {
				test: [
					{
						// Removes 'index.tmp' resource asset.
						folder: 'dist/',
						method: (absoluteItemPath) => new RegExp(/\.tmp$/).test(absoluteItemPath),
						recursive: true,
					},
					{
						// Removes 'css/main' resource asset.
						folder: 'dist/static/css',
						method: (absoluteItemPath) => new RegExp(/\main$/).test(absoluteItemPath),
					},
				],
			},
		}),
		new MiniCssExtractPlugin()
	],
	module: {
		rules: [
			{
				test: /\.html$/,
				type: "asset/resource",
				generator: {
					// Removes the '.tmp' from 'index.tmp'.
					filename: (pathData) => pathData.runtime.split('.')[0] + '.html',
				},
			},
			{
				test: /\.css$/,
				use: [MiniCssExtractPlugin.loader, "css-loader"],
			},
			{
				test: /\.md$/,
				type: "asset/resource",
				use: ["markdown-loader"],
				generator: {
					// Removes the '.tmp' from 'blog.tmp'.
					filename: (pathData) => pathData.runtime.split('.')[0] + '.html',
				},
			},
		],
	},
	optimization: {
		minimize: true,
		minimizer: [
			'...',
			new CssMinimizerPlugin(),
			new HtmlMinimizerPlugin(),
		],
	},
};
