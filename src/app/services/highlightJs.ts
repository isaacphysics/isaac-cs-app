import hljs from "highlight.js/lib/core";
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python'
import php from 'highlight.js/lib/languages/php'
import csharp from 'highlight.js/lib/languages/csharp'
import plaintext from 'highlight.js/lib/languages/plaintext'
import sql from 'highlight.js/lib/languages/sql'
import {Language, LanguageFn} from "highlight.js";

export function registerLanguages() {
    hljs.registerLanguage('javascript', javascript);
    hljs.registerLanguage('python', python);
    hljs.registerLanguage('php', php);
    hljs.registerLanguage('csharp', csharp);
    hljs.registerLanguage('plaintext', plaintext);
    hljs.registerLanguage('sql', sql);
    hljs.registerLanguage('pseudocode', isaacPseudocodeHighlightDefinition);
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

// FIXME: remove the ts-ignore when highlight.js fixes "match" to be allowed to be an array of regexes.
// @ts-ignore
const isaacPseudocodeHighlightDefinition: LanguageFn = function(hljsLib) {
    if (!hljsLib) return {} as Language;  // FIXME: nasty hack to ensure 'hljsLib' has correct type below, remove if types fixed.

    const KEYWORDS = [
        "GLOBAL",
        "MOD",
        "AND",
        "OR",
        "NOT",
        "IF",
        "THEN",
        "ELSEIF",
        "ELSE",
        "ENDIF",
        "SELECT",
        "CASE",
        "DEFAULT",
        "ENDSELECT",
        "FOR",
        "TO",
        "NEXT",
        "WHILE",
        "ENDWHILE",
        "DO",
        "REPEAT",
        "UNTIL",
        "FUNCTION",
        "RETURN",
        "ENDFUNCTION",
        "PROCEDURE",
        "ENDPROCEDURE",
        "BYREF",
        "BYVAL",
        "RECORD",
        "ENDRECORD",
        "ARRAY",
        "CLASS",
        "ENDCLASS",
        "PRIVATE",
        "PUBLIC",
        "PROTECTED",
        "NEW",
    ];

    const LITERALS = [
        "False",
        "True",
        "Null",
    ]

    const BUILT_INS = [
        "STR",
        "INT",
        "FLOAT",
        "INPUT",
        "PRINT",
        "LEN",
        "OPEN_READ",
        "OPEN_WRITE",
        "OPEN_APPEND",
        "READ_LINE",
        "READ_ALL",
        "WRITE_LINE",
        "WRITE_ALL",
        "CLOSE",
        "END_OF_FILE",
        "ASC",
        "CHR",
        "RANDOM_INT"
    ]

    const FUNCTION_DEFINITION = {
        match: [
            /FUNCTION|PROCEDURE/,
            /\s+/,
            hljsLib.UNDERSCORE_IDENT_RE,
            /(?=\()/
        ],
        scope: {
            1: "keyword",
            3: "title.function"
        },
        contains: [],
    };

    return {
        name: 'pseudocode',
        aliases: [
            'isaacPseudocode',
        ],
        keywords: {
           $pattern: hljsLib.UNDERSCORE_IDENT_RE,
            keyword: KEYWORDS,
            literal: LITERALS,
            built_in: BUILT_INS,
        },
        contains: [
            hljsLib.QUOTE_STRING_MODE,
            // C-style comments:
            hljsLib.C_LINE_COMMENT_MODE,
            hljsLib.C_BLOCK_COMMENT_MODE,
            // Or Python-style comments:
            hljsLib.HASH_COMMENT_MODE,
            // Other nice things to highlight:
            hljsLib.NUMBER_MODE,
            FUNCTION_DEFINITION,
        ]
    };
}
