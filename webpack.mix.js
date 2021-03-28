let mix = require("laravel-mix");
let build = require("./tasks/build.js");
require("laravel-mix-alias");

mix.disableSuccessNotifications();
mix.setPublicPath("source/assets/build/");
mix.webpackConfig({
    plugins: [
        build.jigsaw,
        build.browserSync(),
        build.watch([
            "config.php",
            "source/**/*.md",
            "source/**/*.php",
            "source/_assets/**/*.css"
        ])
    ]
});

mix.js("source/_assets/js/main.js", "js")
    .alias({
        "~": "/node_modules"
    })
    .sourceMaps()
    .postCss("source/_assets/css/main.css", "css/main.css", [
        require("postcss-import"),
        require("tailwindcss"),
        require("postcss-nested")
    ])
    .sourceMaps()
    .options({
        processCssUrls: false,
        extractVueStyles: true
    })
    .version();
