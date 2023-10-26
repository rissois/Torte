const isPrintingToConsole = __DEV__ && true
const isMarkingAsPrinted = true

/* 
NOTE: You can do transactions to ensure items were not changed, but seems over-protective 
See actionsPrint transx.js if reimplementing
*/

import firebase from "firebase"
import { doAlertAdd } from "./actionsAlerts"
import { isMatchingLineItem } from "../reducers/reducerLineItems4"

import Encoder from 'esc-pos-encoder';
import EscPosPrinter, {
    getPrinterSeriesByName,
    IPrinter,
} from 'react-native-esc-pos-printer';
import { dateToClock, dateToFullCalendar } from "../../functions/dateAndTime";
import centsToDollar from "../../utils/functions/centsToDollar";
import { firstAndL } from "../../utils/functions/names";

const db = firebase.firestore()

const CAPTION_ORDER = ['size', 'filters', 'modifiers', 'upsells']

const gcd = (a, b) => b ? gcd(b, a % b) : a
const lcm = (a, b) => a * b / (gcd(a, b))


const reduceFraction = (n, d) => {
    const dgcd = gcd(n, d);
    return { num: n / dgcd, denom: d / dgcd };
}

const addFractions = (n1, d1, n2, d2) => {
    const dlcm = lcm(d1, d2)
    return reduceFraction((n1 * dlcm / d1) + (n2 * dlcm / d2), dlcm)
}

const reduceItemFractions = (acc, item) => {
    const prevIndex = acc.findIndex(({ name, caption, }) => name === item.name && caption === item.caption)
    if (~prevIndex) {
        let hold = [...acc]
        const { num, denom } = addFractions(acc[prevIndex].num, acc[prevIndex].denom, item.num, item.denom)
        hold.splice(prevIndex, 1, { ...acc[prevIndex], subtotal: acc[prevIndex].subtotal + item.subtotal, num, denom, fraction: denom > 1 ? num + '/' + denom : num.toString() })
        return hold
    }

    return [...acc, { ...item, fraction: item.denom > 1 ? item.num + '/' + item.denom : item.num.toString() }]
}

// Copied from User app selectBillSummaries
const getBillSummaries = (billItems, table, users = []) => {
    let summaryByUser = {}
    if (table) summaryByUser.table = {
        subtotal: 0,
        tax: 0,
        items: [],
    }
    users.forEach(user_id => summaryByUser[user_id] = {
        subtotal: 0,
        tax: 0,
        items: [],
    })

    Object.keys(billItems)
        .sort((a, b) => billItems[a].position.localeCompare(billItems[b].position))
        .forEach(bill_item_id => {
            if (!billItems[bill_item_id]) return null

            const {
                captions,
                name,
                user_id,
                summary: {
                    subtotal,
                    tax,
                },
            } = billItems[bill_item_id]

            const itemSummary = {
                name,
                captions,
                subtotal,
                num: 1,
            }

            if (table) {
                summaryByUser.table.subtotal += subtotal
                summaryByUser.table.tax += tax
                summaryByUser.table.items.push(itemSummary)
            }

            if (summaryByUser[user_id]) {
                summaryByUser[user_id].subtotal += subtotal
                summaryByUser[user_id].tax += tax
                summaryByUser[user_id].items.push(itemSummary)
            }
        })

    Object.keys(summaryByUser).forEach(user_id => {
        summaryByUser[user_id].items = summaryByUser[user_id].items.reduce((acc, item) => {
            const prevIndex = acc.findIndex(({ name, caption, subtotal, }) => name === item.name && caption === item.caption && subtotal === item.subtotal)
            if (~prevIndex) {
                let hold = [...acc]
                hold.splice(prevIndex, 1, { ...acc[prevIndex], num: acc[prevIndex].num + 1 })
                return hold
            }
            return [...acc, item]
        }, [])
    })

    return summaryByUser
}

// Determine prefix and suffix
const getDixes = (lineItems) => {
    const isKitchen = !!lineItems[0].bill_item_ids
    let maxQuantityLength = 1
    let maxPriceLength = 5 // Smallest is $0.00
    lineItems.forEach(lineItem => {
        let quantityLength
        if (isKitchen) quantityLength = lineItem.bill_item_ids.length
        else {
            quantityLength = lineItem.fraction.length || lineItem.num.toString().length
            const priceLength = lineItem.subtotal.toString().length + 2 // $ and .
            if (priceLength > maxPriceLength) maxPriceLength = priceLength
        }
        if (quantityLength > maxQuantityLength) maxQuantityLength = quantityLength
    })

    return [maxQuantityLength, maxPriceLength]
}

const center = (text, charsPerLine) => {
    const spaces = charsPerLine - text.length
    return (' ').repeat(Math.floor(spaces / 2)) + text + (' ').repeat(Math.ceil(spaces / 2))
}

const log = text => {
    console.log('| ' + text + ' |')
}

const initializePrinter = async printer => {
    let job
    let charsPerLine = 48

    if (isPrintingToConsole) {
        log('‾'.repeat(charsPerLine))
    }
    else {
        await EscPosPrinter.init({
            target: printer.target,
            seriesName: getPrinterSeriesByName(printer.name),
            language: 'EPOS2_LANG_EN',
        });
        const printing = new EscPosPrinter.printing();
        job = await printing
            .initialize()
            .newline(2)

        const { fontA } = await EscPosPrinter.getPrinterCharsPerLine(getPrinterSeriesByName(printer.name)) ?? {};
        if (fontA) charsPerLine = fontA
    }

    return [job, charsPerLine, '- '.repeat(Math.floor(charsPerLine / 2))]
}

const sendToPrinter = (job, charsPerLine, isPrintJobComplete = true) => {
    if (isPrintingToConsole) {
        log('_'.repeat(charsPerLine))
    }
    else {
        job.newline(3).cut()
        if (isPrintJobComplete) job.send()
    }
}

const printKitchenHeader = (job, bill, charsPerLine, dashedLine) => {
    printLine(job, 2, bill.table.name, charsPerLine, '', dateToClock(new Date()))

    printFlat(job, 1, dashedLine)

    if (bill.server.name) {
        printFlat(job, 2, firstAndL(bill.server.name), charsPerLine, true)
        printFlat(job, 1, dashedLine)
    }

    printFlat(job, 1, undefined, charsPerLine)
}

const printBillHeader = (job, bill, charsPerLine, dashedLine) => {
    // QR code notice
    printFlat(job, 3, 'PAY OR SPLIT', charsPerLine, true)
    printFlat(job, 2, 'BY YOUR PHONE BELOW!', charsPerLine, true)

    printFlat(job, 1, undefined, charsPerLine)
    printFlat(job, 1, dashedLine)

    // CUSTOMER??? firstAndL(name)

    const now = new Date()
    printLine(job, 1, bill.table.name, charsPerLine, '', dateToFullCalendar(now) + ' ' + dateToClock(now))
    printLine(job, 1, 'Bill #' + bill.bill_code, charsPerLine, '', 'Ref #' + bill.bill_number)
    if (bill.server.name) printFlat(job, 2, firstAndL(bill.server.name), charsPerLine, true)
    printFlat(job, 1, dashedLine)

    printFlat(job, 1, undefined, charsPerLine)
}

const clearDixes = (dixes) => {
    if (dixes.areCleared) return

    dixes.pre = (' ').repeat(dixes.pre.length)
    dixes.suf = (' ').repeat(dixes.suf.length)
    dixes.areCleared = true
}

const printFlat = (job, size, text, charsPerLine, isCentered) => {
    if (!isPrintingToConsole) {
        job.size(size, size)
        if (size !== 1) charsPerLine = Math.floor(charsPerLine / size)
    }

    if (isPrintingToConsole) {
        if (!text) log(' '.repeat(charsPerLine))
        else if (isCentered) log(center(text, charsPerLine))
        else log(text)
    }
    else {
        if (!text) job.newline()
        else if (isCentered) job.align('center').line(text)
        else job.line(text)
    }
}

const printLine = (job, size = 1, text, charsPerLine, pre = '', suf = '',) => {
    if (!isPrintingToConsole) {
        job.size(size, size)
        if (size !== 1) charsPerLine = Math.floor(charsPerLine / size)
    }

    const textArray = text.split(' ')
    const maxTextLength = charsPerLine - pre.length - suf.length

    let charsRemaining = maxTextLength
    let currentLine = ''

    let dixes = { pre, suf, areCleared: false }

    for (let i = 0; i < textArray.length; i++) {
        let word = textArray[i]

        // This word cannot fit on the line
        if (word.length > charsRemaining) {
            if (currentLine) {
                if (isPrintingToConsole) log(dixes.pre + currentLine.padEnd(maxTextLength, ' ') + dixes.suf)
                else job.line(dixes.pre + currentLine.padEnd(maxTextLength, ' ') + dixes.suf)

                clearDixes(dixes)
                currentLine = ''
                charsRemaining = maxTextLength
            }

            // Consume letters than fill an entire line
            while (word.length > maxTextLength) {
                if (isPrintingToConsole) log(dixes.pre + word.substring(0, maxTextLength) + dixes.suf)
                else job.line(dixes.pre + word.substring(0, maxTextLength) + dixes.suf)
                clearDixes(dixes)
                word = word.substring(maxTextLength)
            }
        }

        // This word is the last on the line
        // OR this is the last word of the text
        if (word.length + 1 >= charsRemaining || i === textArray.length - 1) {
            const temp = currentLine + word
            if (isPrintingToConsole) log(dixes.pre + temp.padEnd(maxTextLength, ' ') + dixes.suf)
            else job.line(dixes.pre + temp.padEnd(maxTextLength, ' ') + dixes.suf)
            clearDixes(dixes)
            currentLine = ''
            charsRemaining = maxTextLength
        }
        else {
            currentLine += word + ' '
            charsRemaining -= word.length
        }
    }
}

const printCaptions = (job, captions, charsPerLine, preLength, sufLength = 0) => {
    if (captions.one_line) {
        const pre = (' ').repeat(preLength)
        const suf = (' ').repeat(sufLength)
        CAPTION_ORDER.forEach(caption => {
            if (!captions[caption]) return
            if (!isPrintingToConsole) job.bold(caption === 'filter')
            printLine(job, 1, captions[caption], charsPerLine, pre, suf)
        })
    }
}


/*
* mixedItems
*   isReprint ? Given bill_item_ids (from BillResend)
*   bill_id ? given lineItemIDs (from Bill)
*   !bill_id ? given lineItems (from Order)

* For the BILL you can trust the redux state, and only get the ID
* For the order, line items may be SPLIT, and therefore get the entire line item as an object
*/
export const doPrintKitchen = (mixedItems, bill_id, isReprint) => {
    return async function (dispatch, getState) {
        const restaurantRef = db.collection('Restaurants').doc(getState().restaurant.id)
        const printers = getState().privates.Printers?.printers ?? {}
        const items = getState().items

        // Singular reference source for all mixedItem arguments 
        const lineItems = isReprint ? getState().billItems[bill_id] : bill_id ? getState().lineItems[bill_id].bill : mixedItems

        try {
            const batch = db.batch()

            // Merge all line items into arrays based on shared printer_id and shared details
            let lineItemsByPrinter = {};
            (bill_id ? mixedItems : Object.keys(mixedItems)).forEach(lineItemID => {
                const lineItem = lineItems[lineItemID]
                const {
                    bill_id,
                    reference_ids: { item_id, variant_id },
                    bill_item_ids,
                    id,
                } = lineItem

                // Order of operations: assigned (custom) > variant > item > stored in BillItem
                const printer_id = item_id === 'custom' ? lineItem.printer_id : items[item_id]?.variants?.[variant_id]?.printer_id || items[item_id]?.printer_id || lineItem.printer_id

                if (printer_id) {
                    /*
                    * Generate printer lines by consolidating like items
                    */
                    // lineItems use bill_item_ids, while billItems are simply their own id
                    // OrderScreen does not provide a bill_id, hence lineItem.bill_id
                    const billItemBillIDs = (bill_item_ids || [id]).map(bill_item_id => ({ bill_item_id, bill_id }))
                    if (!lineItemsByPrinter[printer_id]) {
                        lineItemsByPrinter[printer_id] = [{ ...lineItem, billItemBillIDs }]
                    }
                    else {
                        const matchingIndex = lineItemsByPrinter[printer_id].findIndex(LI => isMatchingLineItem(lineItem, LI))
                        if (~matchingIndex) lineItemsByPrinter[printer_id][matchingIndex].billItemBillIDs.push(...billItemBillIDs)
                        else lineItemsByPrinter[printer_id].push({ ...lineItem, billItemBillIDs })
                    }
                }
                else if (isMarkingAsPrinted) {
                    const billRef = restaurantRef.collection('Bills').doc(bill_id)
                    bill_item_ids.forEach(bill_item_id => {
                        batch.set(billRef.collection('BillItems').doc(bill_item_id),
                            {
                                timestamps: {
                                    marked: firebase.firestore.FieldValue.serverTimestamp()
                                }
                            },
                            { merge: true })
                    })
                }
            })

            let unprinted = []

            // REDUCE + AWAIT PREV ENSURES EVENTS HAPPEN SEQUENTIALLY
            for (const printer_id of Object.keys(lineItemsByPrinter)) {
                try {
                    if (!printers[printer_id]) return unprinted = [...unprinted, lineItemsByPrinter[printer_id]]
                    const printer = printers[printer_id]
                    const lineItems = lineItemsByPrinter[printer_id]

                    console.log(`INIT PRINTER ${printer.station}`)

                    let [job, charsPerLine, dashedLine] = await initializePrinter(printer)

                    const templateBillID = lineItems[Object.keys(lineItems)[0]].bill_id
                    printKitchenHeader(job, getState().bills[templateBillID], charsPerLine, dashedLine)

                    const [maxQuantityLength] = getDixes(lineItems)

                    lineItems
                        .sort((a, b) => a.position.localeCompare(b.position))
                        .forEach(lineItem => {
                            // Consistent quantity length with PADDING AT END
                            const pre = lineItem.bill_item_ids.length.toString().padEnd(maxQuantityLength + 1, ' ')

                            printLine(job, 1, lineItem.name, charsPerLine, pre)

                            printCaptions(job, lineItem.captions, charsPerLine, pre.length)

                            // if (lineItem.captions.one_line) {
                            //     pre = (' ').repeat(pre.length)
                            //     CAPTION_ORDER.forEach(caption => {
                            //         if (!lineItem.captions[caption]) return
                            //         if (!isPrintingToConsole) job.bold(caption === 'filter')
                            //         printLine(job, 1, lineItem.captions[caption], charsPerLine, pre)
                            //     })
                            // }
                        })

                    sendToPrinter(job, charsPerLine)
                    console.log(`SEND PRINTER ${printer.station}`)


                    if (isMarkingAsPrinted) lineItemsByPrinter[printer_id].forEach(lineItem => {
                        lineItem.billItemBillIDs.forEach(({ bill_id, bill_item_id }) => {
                            batch.set(restaurantRef.collection('Bills').doc(bill_id).collection('BillItems').doc(bill_item_id), {
                                timestamps: {
                                    printed: firebase.firestore.FieldValue.serverTimestamp()
                                }
                            }, { merge: true })
                        })
                    })
                }
                catch (error) {
                    console.log(`doPrintKitchen printer error: ${error}`)
                    unprinted = [...unprinted, lineItemsByPrinter[printer_id]]
                }
            }

            if (unprinted.length) {
                let numberUnprinted = 0
                let namesUnprinted = ['You can try and reprint from the bill']
                unprinted.forEach(lineItem => {
                    numberUnprinted += lineItem.billItemBillIDs.length
                    namesUnprinted.push(lineItem.name)
                })
                dispatch(doAlertAdd(
                    `Could not print ${numberUnprinted} items`,
                    namesUnprinted
                ))
            }

            console.log('BATCH COMMIT')

            return await batch.commit()
        }
        catch (error) {
            console.log('actionsPrint doPrintKitchen error: ', error)
            dispatch(doAlertAdd('Failed to print bill items', error.message || error.code || 'Please let us know if the issue persists'))
        }
    }
}

// NOTE: server can be a printUser! but you don't have the user's name...
export const doPrintBill = (bill_id, printBill, printUsers = []) => {
    return async function (dispatch, getState) {
        const bill = getState().bills[bill_id]
        const billItems = getState().billItems[bill_id]
        const receipt_printer_id = getState().privates?.Printers?.receipt_printer

        if (!receipt_printer_id) throw 'There is no printer set up for receipts'
        const receipt_printer = getState().privates.Printers.printers[receipt_printer_id]
        if (!receipt_printer) throw 'There is no printer set up for receipts'

        const summaries = getBillSummaries(billItems, printBill, printUsers)

        let [job, charsPerLine, dashedLine] = await initializePrinter(receipt_printer)

        Object.keys(summaries).forEach(async (user_id, index) => {
            const summary = summaries[user_id]

            printBillHeader(job, bill, charsPerLine, dashedLine)

            const [maxQuantityLength, maxPriceLength] = getDixes(summary.items)

            summary.items.forEach(itemSummary => {
                // Consistent quantity length with padding at start and space at end
                let pre = itemSummary.num.toString().padStart(maxQuantityLength, ' ') + ' '
                let suf = ' ' + centsToDollar(itemSummary.subtotal).padStart(maxPriceLength, ' ')

                printLine(job, 1, itemSummary.name, charsPerLine, pre, suf)

                printCaptions(job, itemSummary.captions, charsPerLine, pre.length, suf.length)

                // if (itemSummary.captions.one_line) {
                //     pre = (' ').repeat(pre.length)
                //     suf = (' ').repeat(suf.length)
                //     CAPTION_ORDER.forEach(caption => {
                //         if (!itemSummary.captions[caption]) return
                //         if (!isPrintingToConsole) job.bold(caption === 'filter')
                //         printLine(job, 1, itemSummary.captions[caption], charsPerLine, pre, suf)
                //     })
                // }
            })

            printFlat(job, 1, undefined, charsPerLine)
            printFlat(job, 1, dashedLine)
            printLine(job, 1, 'Subtotal', charsPerLine, '', centsToDollar(summary.subtotal))
            printLine(job, 1, 'Tax', charsPerLine, '', centsToDollar(summary.tax))
            printLine(job, 1, 'Total', charsPerLine, '', centsToDollar(summary.subtotal + summary.tax))

            printFlat(job, 1, undefined, charsPerLine)
            printFlat(job, 1, 'Scan below to pay & split by phone!', charsPerLine, true)
            if (!isPrintingToConsole) {
                job.qrcode(
                    {
                        value: `https://torteapp.com?r=${bill.restaurant.id}&b=${bill.id}`,
                        level: 'EPOS2_LEVEL_M',
                        width: 5,
                    }
                )
            }

            // Disclaimer? Inform server of any missing or incorrect items 

            sendToPrinter(job, charsPerLine, index === Object.keys(summaries).length - 1)
        })

        // DISPATCH ALERT ANY FAILURES
    }
}

export const doPrintReceipts = (bill_id, payments = {}, isSignRequired, includeLineItems) => {
    return async function (dispatch, getState) {
        const receipt_printer = getState().privates?.Printers?.receipt_printer

        if (!receipt_printer) throw 'There is no printer set up for receipts'

        let [job, charsPerLine, dashedLine] = await initializePrinter(receipt_printer)

        // const { table } = includeLineItems ? getBillSummaries(getState().billItems[bill_id], true) : {}

        // CONVERT THIS INTO A PROMISE.ALLSETTLED!
        Object.keys(payments).forEach(bill_payment_id => {
            const {
                type,
                user: { name },
                line_items,
                summary,
                payment_intent
            } = payments[bill_payment_id]

            // NOTE: There may be type-specific details!
            // E.G. POS payments + includeLineItems => table line items 
            // Or card details, etc.

            // MUST CONVERT line_items , consolidate quantity, etc.

            console.log(`doPrintReceipts init print to receipt_printer ${receipt_printer}`)
            console.log(`doPrintReceipts add table header w/ server, table, or user name (from bill)`)


            const lineItems = line_items.reduce(reduceItemFractions, [])

            const [maxQuantityLength, maxPriceLength] = getDixes(lineItems)

            lineItems.forEach(lineItem => {
                let pre = lineItem.fraction.padStart(maxQuantityLength, ' ') + ' '
                let suf = ' ' + centsToDollar(lineItem.subtotal).padStart(maxPriceLength, ' ')

                printLine(job, 1, lineItem.name, charsPerLine, pre, suf)

                printCaptions(job, lineItem.caption.split('\n'), charsPerLine, pre.length, suf.length)

                // console.log(`Add ${lineItem.num}${lineItem.denom > 1 ? '/' + lineItem.denom : ''} ${lineItem.name}`)
                // console.log(`DO NOT FORGET THE lineItem.captions and lineItem.subtotal!`)
            })

            printFlat(job, 1, undefined, charsPerLine)
            printFlat(job, 1, dashedLine)
            printLine(job, 1, 'Subtotal', charsPerLine, '', centsToDollar(summary.subtotal))
            printLine(job, 1, 'Tax', charsPerLine, '', centsToDollar(summary.tax))
            printLine(job, 1, 'Total', charsPerLine, '', centsToDollar(summary.subtotal + summary.tax))

            console.log(`doPrintReceipts add disclaimer?`)
            if (isSignRequired) {
                console.log(`Duplicate with CUSTOMER COPY and MERCHANT COPY`)
            }
            sendToPrinter(job, charsPerLine)
        })
    }
}

export const doPrintRefunds = (bill_id, refunds = {}, payments = {}, includeLineItems) => {
    return async function (dispatch, getState) {
        const receipt_printer = getState().privates?.Printers?.receipt_printer

        if (!receipt_printer) throw 'There is no printer set up for receipts'

        Object.keys(refunds).forEach(bill_refund_id => {
            const {
                bill_payment_id,
                total,
                tip,
                refund
            } = refunds[bill_refund_id]

            const {
                line_items,
                summary
            } = payments[bill_payment_id] ?? {}

            console.log(`doPrintRefunds init print to receipt_printer ${receipt_printer}`)
            console.log(`doPrintRefunds add table header w/ server, table, or user name (from bill)`)
            if (includeLineItems && line_items) {
                line_items.reduce(reduceItemFractions, []).forEach(lineItem => {
                    console.log(`Add ${lineItem.num}${lineItem.denom > 1 ? '/' + lineItem.denom : ''} ${lineItem.name}`)
                    console.log(`DO NOT FORGET THE lineItem.captions and lineItem.subtotal!`)
                })
            }
            console.log(`doPrintRefunds add summary`)
            console.log(`doPrintRefunds add refund information`)
            console.log(`doPrintRefunds commit print to receipt_printer ${receipt_printer}`)
        })
    }
}