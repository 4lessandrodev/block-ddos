const path = require("path");

module.exports = {
	mode: 'production',
	entry: './lib/index.ts',
	output: {
		filename: 'index.min.js',
		path: path.resolve(__dirname),
		library: 'blockDDoS',
		libraryTarget: 'umd',
		globalObject: 'this',
	},
	module: {
		rules: [
			{
				test: /\.ts?$/,
				include: path.resolve(__dirname, 'lib'),
				use: [
					{
						loader: 'babel-loader',
						options: {
						  cacheDirectory: false
						}
					  },
					{
						loader: 'ts-loader',
						options: {
							transpileOnly: true
						}
					}
				]
			}
		]
	},
	resolve: {
		extensions: ['.ts']
	}
}