const fs = require('fs');
const content = fs.readFileSync('components/providers/language-provider.tsx', 'utf-8');

// The file might be corrupted with \0 or something. Let's remove null bytes.
const cleanContent = content.replace(/\x00/g, '');
const lines = cleanContent.split(/[\r\n]+/);

const matches = [];
lines.forEach((line, i) => {
    if (/(payin|payout|dépôt|retrait|deposit|withdraw)/i.test(line)) {
        matches.push(`${i + 1}: ${line.trim()}`);
    }
});

fs.writeFileSync('search_lang_output.txt', matches.join('\n'), 'utf-8');
console.log("Wrote matches to search_lang_output.txt");
