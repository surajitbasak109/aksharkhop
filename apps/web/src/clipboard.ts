// Copy text to the clipboard. The Clipboard API needs a secure page and focus, so there is a fallback.

function copyWithSelection(text: string): boolean {
    const box = document.createElement('textarea');
    box.value = text;
    box.style.position = 'fixed';
    box.style.opacity = '0';
    // Inside the open <dialog> when there is one: outside it, the modal makes the page inert and the copy fails.
    (document.querySelector('dialog[open]') ?? document.body).appendChild(box);
    box.select();
    try {
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        box.remove();
    }
}

/** True if the text was copied. */
export async function copyText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return copyWithSelection(text);
    }
}
