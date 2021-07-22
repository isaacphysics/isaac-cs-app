import hljs from "highlight.js/lib/core";
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python'
import php from 'highlight.js/lib/languages/php'
import csharp from 'highlight.js/lib/languages/csharp'
import plaintext from 'highlight.js/lib/languages/plaintext'
import sql from 'highlight.js/lib/languages/sql'

export function registerLanguages() {
    hljs.registerLanguage('javascript', javascript);
    hljs.registerLanguage('python', python);
    hljs.registerLanguage('php', php);
    hljs.registerLanguage('csharp', csharp);
    hljs.registerLanguage('plaintext', plaintext);
    hljs.registerLanguage('sql', sql);
}

export function addLineNumbers(code: Element) {
    // Adapt the PrismJS code for line numbering:
    // https://github.com/PrismJS/prism/blob/v1.24.1/plugins/line-numbers/prism-line-numbers.js
    // This will not work for code that is wrapped onto multiple lines; see the PrismJS
    // code above for a (horrid!) method for dealing with wrapped lines.

    const pre = code.parentElement;

    // This works only for <code> wrapped inside <pre> and not inline code.
    if (!pre || !/pre/i.test(pre.nodeName)) {
        return;
    }

    // Abort if line numbers already exists
    if (code.querySelector('.line-numbers-rows')) {
        return;
    }

    const newlines = code.textContent?.match(/\n(?!$)/g);
    const numberOfLines = newlines ? newlines.length + 1 : 1;

    // Add blank spans, one per line, that will be numbered using a CSS counter:
    const lineNumberSpans = new Array(numberOfLines + 1).join('<span></span>');

    const lineNumbersWrapper = document.createElement('span');
    lineNumbersWrapper.setAttribute('aria-hidden', 'true');
    lineNumbersWrapper.className = 'line-numbers-rows';
    lineNumbersWrapper.innerHTML = lineNumberSpans;

    if (pre.hasAttribute('data-start')) {
        pre.style.counterReset = 'linenumber ' + (parseInt(pre.getAttribute('data-start') as string, 10) - 1);
    }

    code.appendChild(lineNumbersWrapper);
}
