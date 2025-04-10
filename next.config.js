/** @type {import('next').NextConfig} */
const FsModulePlugin = require('./webpack-fs-plugin');

const nextConfig = {
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
        path: require.resolve('path-browserify'),
        zlib: require.resolve('browserify-zlib'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        assert: require.resolve('assert/'),
        os: require.resolve('os-browserify/browser'),
        url: require.resolve('url/'),
        buffer: require.resolve('buffer/'),
      };

      // Add polyfills
      config.plugins.push(
        new config.webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
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