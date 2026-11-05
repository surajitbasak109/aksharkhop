import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['data/', '**/node_modules/', '**/dist/', 'scripts/'] },
    ...tseslint.configs.recommended,
);
