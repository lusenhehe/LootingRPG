module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    // 禁止跨层导入
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          // UI 组件不得被 domain 或 infra/等层引用
          {
            group: ['src/**/*.ui/*.ts', 'src/**/*.ui/*.tsx'],
            message: '禁止从其他域导入 UI 组件，UI 只能在页面/组件层使用。',
          },
          // 域不得引用 app 组装层
          {
            group: ['src/app/**'],
            message: '域代码不应依赖 app 层，以免产生循环耦合。',
          },
        ],
      },
    ],
  },
};
