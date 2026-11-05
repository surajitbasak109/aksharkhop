import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    // The repo-root public/ holds words.bn.json, built by scripts/build_wordlist.py (untracked).
    publicDir: '../../public',
    server: { port: 5173, strictPort: true },
});
