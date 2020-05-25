module.exports = {
    theme: {
        purge: {
            content: ["./source"],

            options: {
                extensions: ["html", "md", "js", "php", "vue"],
                whitelistPatterns: [/language/, /hljs/]
            }
        },
        extend: {
            colors: {
                twitter: "#1da1f2",
                facebook: "#088bf0",
                youtube: "#ff0000",
                github: "#252a2e",
                instagram: "#23201e",
                gitlab: "#e2432a"
            },
            fontFamily: {
                sans: ["Inter"],
                mono: ["Fira Code", "monospace"]
            },
            lineHeight: {
                normal: "1.6",
                loose: "1.75"
            },
            maxWidth: {
                none: "none",
                "7xl": "80rem",
                "8xl": "88rem",
                "0": 0,
                "1": "0.25rem",
                "2": "0.5rem",
                "3": "0.75rem",
                "4": "1rem",
                "5": "1.25rem",
                "6": "1.5rem",
                "8": "2rem",
                "10": "2.5rem",
                "12": "3rem",
                "16": "4rem",
                "20": "5rem",
                "24": "6rem",
                "32": "8rem",
                "40": "10rem",
                "48": "12rem",
                "56": "14rem",
                "64": "16rem"
            },
            maxHeight: {
                "7xl": "80rem",
                "8xl": "88rem",
                "0": 0,
                "1": "0.25rem",
                "2": "0.5rem",
                "3": "0.75rem",
                "4": "1rem",
                "5": "1.25rem",
                "6": "1.5rem",
                "8": "2rem",
                "10": "2.5rem",
                "12": "3rem",
                "16": "4rem",
                "20": "5rem",
                "24": "6rem",
                "32": "8rem",
                "40": "10rem",
                "48": "12rem",
                "56": "14rem",
                "64": "16rem"
            },
            spacing: {
                "7": "1.75rem",
                "9": "2.25rem"
            },
            boxShadow: {
                lg:
                    "0 -1px 27px 0 rgba(0, 0, 0, 0.04), 0 4px 15px 0 rgba(0, 0, 0, 0.08)"
            }
        },
        fontSize: {
            xs: ".8rem",
            sm: ".925rem",
            base: "1rem",
            lg: "1.125rem",
            xl: "1.25rem",
            "2xl": "1.5rem",
            "3xl": "1.75rem",
            "4xl": "2.125rem",
            "5xl": "2.625rem",
            "6xl": "10rem"
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
