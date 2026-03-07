const fs = require('fs');
const path = require('path');

const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('./app/dashboard');

let modifiedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Pattern for new Date(...).toLocaleDateString(...) or toLocaleString(...) over multiple lines
    // We use a non-greedy .*?
    const regex = /new Date\(((?:[^)(]+|\([^)(]*\))*)\)\.toLocale(?:Date)?String\([^)]*\)/g;

    let matched = false;
    content = content.replace(regex, (match, inner) => {
        matched = true;
        return `formatApiDateTime(${inner})`;
    });

    if (matched && content !== original) {
        if (!content.includes('import { formatApiDateTime }') && !content.includes('formatApiDateTime,')) {
            const utilsImportRegex = /import\s+{([^}]*)}\s+from\s+["']@\/lib\/utils["']/g;
            const matches = [...content.matchAll(utilsImportRegex)];
            if (matches.length > 0) {
                const innerImports = matches[0][1];
                const newImport = `import { formatApiDateTime, ${innerImports} } from "@/lib/utils"`;
                content = content.replace(matches[0][0], newImport);
            } else {
                const importMatches = [...content.matchAll(/import\s+.*from\s+.*[\r\n]+/g)];
                if (importMatches.length > 0) {
                    const lastImport = importMatches[importMatches.length - 1][0];
                    content = content.replace(lastImport, lastImport + 'import { formatApiDateTime } from "@/lib/utils";\n');
                } else {
                    content = 'import { formatApiDateTime } from "@/lib/utils";\n' + content;
                }
            }
        }

        fs.writeFileSync(file, content, 'utf8');
        modifiedFiles++;
        console.log(`Updated ${file}`);
    }
});
console.log(`Updated ${modifiedFiles} files.`);
