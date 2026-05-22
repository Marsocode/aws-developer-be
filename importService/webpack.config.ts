const path = require('path');

module.exports = {
  mode: 'production',

  target: 'node',

  entry: {
    importProductsFile: path.resolve(__dirname, 'lambda/importProductsFile/index.ts'),
    importFileParser: path.resolve(__dirname, 'lambda/importFileParser/index.ts'),
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]/index.js',
    libraryTarget: 'commonjs2',
  },

  resolve: {
    extensions: ['.ts', '.js'],

    alias: {
      '/opt/nodejs': path.resolve(__dirname, '../common/nodejs'),
    },
  },

  externals: {
    '/opt/nodejs': 'commonjs2 /opt/nodejs',
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
