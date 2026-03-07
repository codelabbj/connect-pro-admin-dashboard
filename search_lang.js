const fs = require('fs');
const content = fs.readFileSync('components/providers/language-provider.tsx', 'utf-8');
const lines = content.split('\n');
const matches = [];
lines.forEach((line, i) => {
    if (/deposit|withdraw|payin|pay out|pay in/i.test(line)) {
        matches.push(`${i + 1}: ${line.trim()}`);
    }
});
console.log(matches.join('\n'));
