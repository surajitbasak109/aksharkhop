/**
 * Where the word list is fetched from. By default it is served beside the app (`/words.bn.json`).
 * Set `VITE_WORDS_URL` at build time to load it from somewhere else (that server must allow
 * cross-origin requests).
 */
export const WORDS_URL: string = import.meta.env.VITE_WORDS_URL || `${import.meta.env.BASE_URL}words.bn.json`;
