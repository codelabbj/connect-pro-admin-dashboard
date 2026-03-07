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
let inAggregatorsEN = false;
let inAggregatorsFR = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('"aggregators.title": "Aggregators"')) inAggregatorsEN = true;
    if (lines[i].includes('"aggregators.title": "AgrÃ©gateurs"')) inAggregatorsFR = true;

    // Stop at the next block
    if (lines[i].includes('"transactions.title":') || lines[i].includes('// Transactions')) {
        inAggregatorsEN = false;
        inAggregatorsFR = false;
    }

    // Replace English in aggregators block
    if (inAggregatorsEN || lines[i].includes('"common.payinFee"') || lines[i].includes('"common.payoutFee"')) {
        let old = lines[i];
        lines[i] = lines[i].replace(/Payins/g, "Pay ins");
        lines[i] = lines[i].replace(/Payouts/g, "Pay outs");
        lines[i] = lines[i].replace(/Payin/g, "Pay in");
        lines[i] = lines[i].replace(/Payout/g, "Pay out");
        lines[i] = lines[i].replace(/payin/g, "pay in");
        lines[i] = lines[i].replace(/payout/g, "pay out");
        // Don't mess up the keys (left side of :)
        // We only want to replace the right side of the colon, but wait!
        // aggregators.payinPerformance shouldn't be aggregators.pay inPerformance!
        if (old.includes(': "')) {
            let parts = old.split(': "');
            let rightSide = parts[1];
            rightSide = rightSide.replace(/Payins/g, "Pay ins");
            rightSide = rightSide.replace(/Payouts/g, "Pay outs");
            rightSide = rightSide.replace(/Payin/g, "Pay in");
            rightSide = rightSide.replace(/Payout/g, "Pay out");
            rightSide = rightSide.replace(/payin/gi, "pay in");
            rightSide = rightSide.replace(/payout/gi, "pay out");
            lines[i] = parts[0] + ': "' + rightSide;
        }
    }

    // Replace French in aggregators block
    if (inAggregatorsFR || (lines[i].includes('"common.payinFee"') && inAggregatorsFR) || lines[i].includes('dashboard.depositsCount') || lines[i].includes('dashboard.withdrawalsCount')) {
        // Same here, only in value
        if (lines[i].includes(': "')) {
            let parts = lines[i].split(': "');
            let rightSide = parts[1];
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
console.log('Done replacement');
