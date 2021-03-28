const colors = require("tailwindcss/colors");
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
    purge: {
        content: ["./source/**/*{.html,.md,.vue,.js,.php}"],

        options: {
            safelistPatterns: [/language/, /hljs/]
        }
    },
    theme: {
        colors: {
            twitter: "#1da1f2",
            facebook: "#088bf0",
            youtube: "#ff0000",
            github: "#252a2e",
            instagram: "#23201e",
            gitlab: "#e2432a",
            transparent: "transparent",
            current: "currentColor",
            black: colors.black,
            white: colors.white,
            gray: colors.blueGray,
            red: colors.red,
            green: colors.green,
            yellow: colors.yellow,
            primary: {
                50: "var(--primary-50)",
                100: "var(--primary-100)",
                200: "var(--primary-200)",
                300: "var(--primary-300)",
                400: "var(--primary-400)",
                500: "var(--primary-500)",
                600: "var(--primary-600)",
                700: "var(--primary-700)",
                800: "var(--primary-800)",
                900: "var(--primary-900)"
            }
        },
        fontFamily: {
            sans: ["Inter"],
            serif: defaultTheme.serif,
            mono: ["Fira Code", "monospace"]
        }
    },
    variants: {
        borderRadius: ["responsive", "focus"],
        borderWidth: ["responsive", "active", "focus"],
        width: ["responsive", "focus"]
    },
    plugins: [
        function({ addUtilities }) {
            const newUtilities = {
                ".transition-fast": {
                    transition: "all .2s ease-out"
                },
                ".transition": {
                    transition: "all .5s ease-out"
                }
            };
            addUtilities(newUtilities);
        }
    ]
};
