const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
    const isProd = argv.mode === 'production';

    return {
        entry: './src/main.js',
        output: {
            filename: 'custom.js',
            path: path.resolve(__dirname, 'js')
        },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader'
                    ]
                }
            ]
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: '../css/custom.css'
            })
        ],
        devServer: {
            static: {
                directory: path.resolve(__dirname)
            },
            watchFiles: ['src/**/*.js', 'index.html'],
            port: 9000,
            open: false,
            client: {
                logging: 'info'
            },
            setupMiddlewares: (middlewares, devServer) => {
                if (!devServer) {
                    throw new Error('webpack-dev-server is not defined');
                }

                devServer.app.use((req, res, next) => {
                    res.on('finish', () => {
                        const timeStamp = new Date().toISOString();
                        const { method, url } = req;
                        const { statusCode } = res;

                        let icon = '⚠️ ';
                        let color = '\x1b[33m';

                        if (statusCode >= 200 && statusCode < 300) {
                            icon = '✅';
                            color = '\x1b[32m';
                        } else if (statusCode >= 400 && statusCode < 500) {
                            icon = '❌';
                            color = '\x1b[31m';
                        }

                        const reset = '\x1b[0m';
                        const coloredStatus = `[${color}${statusCode}${reset}]`;

                        console.log(`[${timeStamp}] ${icon} ${coloredStatus} [${method} ${url}]`);
                    });

                    next();
                });

                return middlewares;
            }
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src')
            }
        },
        devtool: isProd ? false : 'source-map',
        mode: isProd ? 'production' : 'development'
    };
};
