export interface ParsedItem {
    name: string;
    price: number;
    quantity: number;
}

export interface ParsedReceipt {
    amount?: number;
    date?: string;
    merchant?: string;
    items: ParsedItem[];
}

export function parseReceipt(text: string): ParsedReceipt {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let amount: number | undefined;
    let date: string | undefined;
    let merchant: string | undefined;
    const items: ParsedItem[] = [];

    // 1. Merchant: Usually the first non-empty line
    if (lines.length > 0) {
        merchant = lines[0];
    }

    // Common noise words to exclude from being "items" even if they have numbers
    const noiseWords = ['TOTAL', 'SUBTOTAL', 'TAX', 'CASH', 'CHANGE', 'VISA', 'MASTERCARD', 'AMEX', 'BAL', 'BALANCE', 'DUE', 'AMOUNT'];

    // 2. Iterate lines to find Items and Date
    const amountRegex = /[\$]?\s?(\d{1,3}(?:,\d{3})*|\d+)\.(\d{2})/g;
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4})|(\d{4}-\d{1,2}-\d{1,2})/;

    const allAmounts: number[] = [];

    for (const line of lines) {
        // Check for Date
        if (!date) {
            const dateMatch = line.match(dateRegex);
            if (dateMatch) {
                try {
                    const d = new Date(dateMatch[0]);
                    if (!isNaN(d.getTime())) {
                        date = d.toISOString().split('T')[0];
                    }
                } catch (e) { }
            }
        }

        // Check for Price at end of line
        const matches = [...line.matchAll(amountRegex)];
        if (matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            const cleanVal = lastMatch![0].replace(/[^0-9.]/g, '');
            const val = parseFloat(cleanVal);

            if (!isNaN(val)) {
                allAmounts.push(val);

                // Check if line ends with a price
                const priceMatch = line.match(/(\d+\.\d{2})$/);

                if (priceMatch) {
                    const itemPrice = parseFloat(priceMatch[0]);

                    const isTotal = /total/i.test(line);
                    const isTax = /tax|vat/i.test(line);

                    // Use the 'amount' variable from the outer scope for comparison
                    if (!isTotal && !isTax && amount !== undefined && itemPrice < amount) {
                        // It's likely a line item
                        // Extract Name (everything before the price)
                        let name = line.substring(0, priceMatch.index).trim();

                        // Attempt to find quantity (e.g., "2 x 10.00" or "2 @ 10.00")
                        let quantity = 1;
                        const qtyMatch = line.match(/^(\d+)\s*[@x]/i);
                        if (qtyMatch && qtyMatch[1]) {
                            quantity = parseInt(qtyMatch[1], 10);
                            name = name.replace(/^(\d+)\s*[@x]/i, '').trim();
                        }

                        if (name.length > 0) {
                            items.push({ name, price: itemPrice, quantity });
                        }
                    }
                }
            }
        }
    }

    // 3. Heuristic for Total Amount: Max value found
    if (allAmounts.length > 0) {
        amount = Math.max(...allAmounts);
    }

    return { amount, date, merchant, items };
}
