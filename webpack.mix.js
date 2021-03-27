let mix = require("laravel-mix");
let build = require("./tasks/build.js");

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
    .vue({ extractStyles: true })
    .sourceMaps()
    .postCss("source/_assets/css/main.css", "css/main.css", [
        require("postcss-import"),
        require("@tailwindcss/jit"),
        require("postcss-nested")
    ])
    .sourceMaps()
    .options({
        processCssUrls: false
    })
    .version();
