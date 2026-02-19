const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
	{
		files: ['nodes/**/*.ts', 'credentials/**/*.ts'],
		extends: [tseslint.configs.recommended],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
	{
		ignores: ['dist/', 'node_modules/', 'tests/', '*.js'],
	},
);
