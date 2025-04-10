/** @type {import('next').NextConfig} */
const FsModulePlugin = require('./webpack-fs-plugin');
const webpack = require('webpack');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@uniswap/widgets', '@fontsource/inter'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        zlib: require.resolve('browserify-zlib'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify/browser'),
        buffer: require.resolve('buffer/'),
        util: require.resolve('util/'),
        url: require.resolve('url'),
        assert: require.resolve('assert/'),
        constants: require.resolve('constants-browserify')
      };

      // Add polyfills
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
      
      // Add our custom plugin
      config.plugins.push(new FsModulePlugin());
    }

    // Ignore specific modules that cause issues
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/@uniswap/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: ['@babel/plugin-transform-runtime'],
        },
      },
    });

    // Add a specific rule for the problematic module
    config.module.rules.push({
      test: /node_modules\/.*\/build\/mem\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: ['@babel/plugin-transform-runtime'],
        },
      },
    });

    // Add a specific alias for the problematic module
    config.resolve.alias = {
      ...config.resolve.alias,
      fs: false,
      path: require.resolve('path-browserify'),
    };

    return config;
  },
}

module.exports = nextConfig 