module.exports = [
  {
    ignores: ['lib', 'node_modules', 'dist', 'coverage']
  },
  {
    // Additional ESLint rules can go here
    files: ['**/*.ts'],
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'error'
    }
  }
]
