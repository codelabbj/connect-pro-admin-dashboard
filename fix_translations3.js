const fs = require('fs');

let content = fs.readFileSync('components/providers/language-provider.tsx', 'utf-8');

if (!content.includes('"common.payin":')) {
    content = content.replace(
        /"common\.networkLayer": "Network Layer",/,
        '"common.networkLayer": "Network Layer",\n    "common.payin": "Pay in",\n    "common.payout": "Pay out",'
    );
    content = content.replace(
        /"common\.networkLayer": "Couche rÃ©seau",/,
        '"common.networkLayer": "Couche rÃ©seau",\n    "common.payin": "Pay in",\n    "common.payout": "Pay out",'
    );
}

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    // English replacements
    if (lines[i].includes('"aggregators.') || lines[i].includes('"common.payinFee"') || lines[i].includes('"common.payoutFee"')) {
        if (lines[i].includes(': "')) {
            let parts = lines[i].split(': "');
            let rightSide = parts[1];

            // English replace
            rightSide = rightSide.replace(/Payins/g, "Pay ins");
            rightSide = rightSide.replace(/Payouts/g, "Pay outs");
            rightSide = rightSide.replace(/Payin/g, "Pay in");
            rightSide = rightSide.replace(/Payout/g, "Pay out");
            rightSide = rightSide.replace(/payin/g, "pay in");
            rightSide = rightSide.replace(/payout/g, "pay out");

            // French replace
            rightSide = rightSide.replace(/des dÃ©pÃ´ts/g, "des pay ins");
            rightSide = rightSide.replace(/des retraits/g, "des pay outs");
            rightSide = rightSide.replace(/DÃ©pÃ´t/g, "Pay in");
            rightSide = rightSide.replace(/dÃ©pÃ´t/g, "pay in");
            rightSide = rightSide.replace(/Retrait/g, "Pay out");
            rightSide = rightSide.replace(/retrait/g, "pay out");

            lines[i] = parts[0] + ': "' + rightSide;
        }
    }
}

content = lines.join('\n');
fs.writeFileSync('components/providers/language-provider.tsx', content, 'utf-8');
console.log('Translations correctly replaced!');
