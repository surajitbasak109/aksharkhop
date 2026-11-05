import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    // The repo-root public/ holds words.txt (the word list the app loads, built by scripts/build_wordlist.py)
    // and the favicon. The full words.bn.json built beside it is not committed and the app does not use it.
    publicDir: '../../public',
    server: { port: 5173, strictPort: true },
});
