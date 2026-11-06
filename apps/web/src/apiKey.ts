// The user's own Claude API key, kept in memory only: never in localStorage, a cookie, a URL, a saved
// puzzle or an export. It is gone when the page is reloaded or closed.
let key = '';

export const getApiKey = (): string => key;
export const setApiKey = (value: string): void => {
    key = value.trim();
};
export const clearApiKey = (): void => {
    key = '';
};
