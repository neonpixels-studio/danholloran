module.exports = {
    extends: [
        "eslint:recommended",
        "plugin:vue/essential",
        "plugin:vue/strongly-recommended",
        "plugin:vue/recommended"
    ],
    env: {
        browser: true,
        commonjs: true,
        es6: true,
        node: true,
        jquery: true
    },
    rules: {
        "no-const-assign": "warn",
        "no-this-before-super": "warn",
        "no-undef": "warn",
        "no-unreachable": "warn",
        "no-unused-vars": "warn",
        "constructor-super": "warn",
        "valid-typeof": "warn",
        semi: "error"
    }
};
