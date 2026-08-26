module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true
  },
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  extends: [
    '@nuxtjs'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'indent': 'off',
    'template-curly-spacing': 'off',
    'vue/no-v-html': 'off'
  }
}
