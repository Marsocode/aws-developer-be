const path = require('path');

module.exports = {
  mode: 'production',
  target: 'node',

  entry: {
    basicAuthorizer: path.resolve(__dirname, 'lambda/basicAuthorizer/index.ts'),
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]/index.js',
    libraryTarget: 'commonjs2',
  },

  resolve: {
    extensions: ['.ts', '.js'],
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
