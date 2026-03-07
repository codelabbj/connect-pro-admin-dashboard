const fs = require('fs');

let content = fs.readFileSync('components/providers/language-provider.tsx', 'utf-8');

// Also add common.payin and common.payout if they don't exist
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
let inAggregatorsFR = false;
let inAggregatorsEN = false;

for (let i = 0; i < lines.length; i++) {
    // English aggregators block starts somewhere around line 360
    if (lines[i].includes('"aggregators.title": "Aggregators"')) {
        inAggregatorsEN = true;
    }
    // French aggregators block starts somewhere around line 2140
    if (lines[i].includes('"aggregators.title": "AgrÃ©gateurs"')) {
        inAggregatorsFR = true;
    }

    // Both blocks end before next section or transactions
    if (lines[i].includes('"transactions.title": "Transactions"')) {
        inAggregatorsEN = false;
        inAggregatorsFR = false;
    }

    if (inAggregatorsEN || lines[i].includes('common.payinFee') || lines[i].includes('common.payoutFee')) {
        // Change english Payin -> Pay in, Payout -> Pay out
        lines[i] = lines[i].replace(/Payins/g, "Pay ins");
        lines[i] = lines[i].replace(/Payouts/g, "Pay outs");
        lines[i] = lines[i].replace(/Payin/g, "Pay in");
        lines[i] = lines[i].replace(/Payout/g, "Pay out");
    }

    if (inAggregatorsFR || lines[i].includes('common.payinFee') || lines[i].includes('common.payoutFee') || lines[i].includes('dashboard.payin') || lines[i].includes('dashboard.payout')) {
        // Change French dÃ©pÃ´t / DÃ©pÃ´t, etc.
        lines[i] = lines[i].replace(/des dÃ©pÃ´ts/g, "des pay ins");
        lines[i] = lines[i].replace(/des retraits/g, "des pay outs");
        lines[i] = lines[i].replace(/DÃ©pÃ´t/g, "Pay in");
        lines[i] = lines[i].replace(/dÃ©pÃ´t/g, "pay in");
        lines[i] = lines[i].replace(/Retrait/g, "Pay out");
        lines[i] = lines[i].replace(/retrait/g, "pay out");
    }
}

content = lines.join('\n');
fs.writeFileSync('components/providers/language-provider.tsx', content, 'utf-8');
console.log('Replacements completed.');
