const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')

const isProduction = process.env.NODE_ENV === 'production'
const ExtractTextPlugin = require('extract-text-webpack-plugin')
// 为了抽离出两份CSS，创建两份ExtractTextPlugin
// base作为基础的css，基本不变，所以，可以抽离出来充分利用浏览器缓存
// app作为迭代的css，会经常改变
const extractBaseCss = 
    new ExtractTextPlugin(
        {
            filename:'static/css/base.[chunkhash:8].css',
            allChunks:true,
            disable:!isProduction // 开发环境下不抽离css
        }
    )
const extractAppCss = 
    new ExtractTextPlugin(
        {
            filename:'static/css/app.[chunkhash:8].css',
            allChunks:true,
            disable:!isProduction // 开发环境下不抽离css
        }
    )
// __dirname: 总是返回被执行的 js 所在文件夹的绝对路径
// __filename: 总是返回被执行的 js 的绝对路径
// process.cwd(): 总是返回运行 node 命令时所在的文件夹的绝对路径
// 减少路径书写
function resolve(dir){
    return path.join(__dirname,dir)
}

//网站图标配置
const favicon = resolve('favicon.ico')

const config = {
    //sourcemap模式
    devtool: 'cheap-module-eval-source-map',
    //入口
    entry:{
        app: resolve('app/index.js')
    },
    //输出
    output:{
        path: resolve('dev'),
        filename: 'index.bundle.js'
    },
    resolve: {
        // 扩展名, 比如import 'app.vue', 扩展后只需要写成 import 'app' 就可以了
        extensions: ['.js','.vue','.scss','.css'],
        // 设置路径别名，方便在业务代码中import
        alias:{
            api: resolve('app/api/'),
            common: resolve('app/common/'),
            views: resolve('app/views/'),
            components: resolve('app/components/'),
            componentsBase: resolve('app/componentsBase/'),
            directives: resolve('app/directives/'),
            filters: resolve('app/filters/'),
            mixins: resolve('app/mixins/'),
        }
    },
    module:{
        rules:[
            // 处理js文件逻辑
            {
                test:/\.js$/,
                include:[resolve('app')],
                loader:[
                    'babel-loader',
                    'eslint-loader'
                ]
            },
            {
                test:/\.vue$/,
                exclude:/node_modules/,
                loader: 'vue-loader',
                options:{
                    scss: extractAppCss.extract({
                        fallback:'vue-style-loader',
                        use:[
                            {
                                loader:'css-loader',
                                options:{
                                    sourceMap:true
                                }
                            }, {
                                loader:'postcss-loader',
                                options:{
                                    sourceMap:true
                                }
                            }, {
                                loader:'sass-loader',
                                options:{
                                    soutceMap:true
                                }
                            }
                        ]
                    })
                }
            }, {
                test:/\.(css|scss)$/,
                use:extractBaseCss.extract({
                    fallback: 'style-loader',
                    use: [{
                        loader:'css-loader',
                        options:{
                            sourceMap:true
                        }
                    },{
                        loader:'postcss-loader',
                        options:{
                            sourceMap: true
                        }
                    }, {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true
                        }
                    }]
                })
            },{
                test: /\.(png|jpe?g|gif|svg|ico)(\?.*)?$/,
                loader:'url-loader',
                options:{
                    limit:8192,
                    name:isProduction ? 'static/font/[name].[hash:8].[ext]' : 'static/font/[name].[ext]'
                }
            }
        ]
    }, 
    plugins: [
        //html 模版插件
        new HtmlWebpackPlugin({
            favicon,
            filename:'index.html',
            template:resolve('app/index.html')
        }),
        extractBaseCss,
        extractAppCss,
        // 热更新插件
        new webpack.HotModuleReplacementPlugin(),
        new FriendlyErrorsPlugin()
    ],
    devserver:{
        proxy:{
            '/api': {
                target:'http://localhost:7777',
                secure:false
            }
        },
        host: '0.0.0.0',
        port: '9999',
        disableHostCheck: true,
        contentBase: resolve('dev'),
        inline:true, // 实时刷新
        hot: true //使用热加载插件
    }
}

module.exports = {
    config: config,
    extractBaseCss: extractBaseCss,
    extractAppCss: extractAppCss
}