const storageKey = "dh:theme";

export const themes = ["Indigo", "Blue", "Teal", "Green", "Gray"];
export const themeOptions = themes.map(theme => {
    return {
        label: theme,
        value: theme.toLowerCase()
    };
});

const setThemeClass = theme => {
    const $body = document.body;
    const classes = themeOptions.map(({ value }) => `theme-${value}`);

    $body.classList.remove(...classes);
    $body.classList.add(`theme-${theme}`);
};

const setThemeFavicon = theme => {
    document
        .getElementById("theme_favicon")
        .setAttribute("href", `/assets/img/favicons/${theme}.svg?v=js`);
};

export const setTheme = theme => {
    setThemeClass(theme);
    setThemeFavicon(theme);
    window.localStorage.setItem(storageKey, theme);
};

export const getTheme = () => {
    let theme = window.localStorage.getItem(storageKey);
    if (theme) {
        return theme;
    }

    document.body.classList.forEach(value => {
        if (value.indexOf("theme-") === 0) {
            theme = value.replace("theme-", "");
        }
    });

    return theme;
};
