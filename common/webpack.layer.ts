const path = require('path');

module.exports = {
  mode: 'production',

  target: 'node',

  entry: {
    index: path.resolve(__dirname, 'nodejs/index.ts'),
  },

  output: {
    path: path.resolve(__dirname, 'dist/nodejs'),
    filename: '[name].js',
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
