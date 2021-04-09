import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import php from 'highlight.js/lib/languages/php';
import csharp from 'highlight.js/lib/languages/csharp';
import plaintext from 'highlight.js/lib/languages/plaintext';

export function registerLanguages() {
    hljs.registerLanguage('javascript', javascript);
    hljs.registerLanguage('python', python);
    hljs.registerLanguage('php', php);
    hljs.registerLanguage('csharp', csharp);
    hljs.registerLanguage('plaintext', plaintext);
}
