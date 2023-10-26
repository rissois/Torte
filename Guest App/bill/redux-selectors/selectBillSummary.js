import { createSelector } from 'reselect'
import { selectBillUserNames } from '../../redux/selectors/selectorsBill'
import { selectMyID } from '../../redux/selectors/selectorsUser'

const emptyArray = []
const summary = () => ({
    subtotal: 0,
    tax: 0,
    items: [],
})

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

const reduceGroupFraction = (acc, group) => {
    const prevIndex = acc.findIndex(({ name, caption, subtotal, }) => name === group.name && caption === group.caption)
    if (~prevIndex) {
        let hold = [...acc]
        hold.splice(prevIndex, 1, { ...acc[prevIndex], subtotal: acc[prevIndex].subtotal + group.subtotal, ...addFractions(acc[prevIndex].num, acc[prevIndex].denom, group.num, group.denom) })
        return hold
    }
    return [...acc, group]
}


export const selectBillSummaries = (isReceipt) => createSelector(
    // state => state.bill?.bill,
    state => state.bill?.billItems,
    selectBillUserNames,
    selectMyID,
    (billItems, billUserNames = {}, myID = '',) => {
        /*
        BILL for:
            bill_item_status (status) ... not strictly necessary
            table order values... not strictly necessary
            table paid status... not strictly necessary
        */

        let tableSummary = { ...summary(), id: 'table', name: 'Table' }
        let serverSummary = { ...summary(), id: 'server', name: 'Server' }
        let summaryByUser = {}

        Object.keys(billItems)
            .sort((a, b) => billItems[a].position.localeCompare(billItems[b].position))
            .forEach(bill_item_id => {
                if (!billItems[bill_item_id]) return null

                const {
                    units: { denom, paid: paid_units, claimed, charged: charged_units, available },
                    captions: { line_break: caption },
                    name,
                } = billItems[bill_item_id]

                const isPaid = !(available.length || Object.keys(claimed).length)

                if (isReceipt) { // PAID UNITS
                    Object.keys(paid_units).forEach(user_id => {
                        const {
                            subtotal,
                            tax
                        } = paid_units[user_id].reduce((acc, unit) => ({ subtotal: acc.subtotal + unit.subtotal, tax: acc.tax + unit.tax }), { subtotal: 0, tax: 0 })

                        if (!summaryByUser[user_id]) {
                            summaryByUser[user_id] = summary()
                        }
                        // if (!is_voided) {
                        summaryByUser[user_id].subtotal += subtotal
                        summaryByUser[user_id].tax += tax
                        // }
                        summaryByUser[user_id].items.push({
                            name,
                            caption,
                            subtotal,
                            num: paid_units[user_id].length,
                            denom,
                            isPaid,
                        })
                    })

                    Object.keys(charged_units).forEach(user_id => {
                        const {
                            subtotal,
                            tax,
                            is_redistributed,
                        } = charged_units[user_id].reduce((acc, unit) => ({ subtotal: acc.subtotal + unit.subtotal, tax: acc.tax + unit.tax }), { subtotal: 0, tax: 0 })

                        if (!summaryByUser[user_id]) {
                            summaryByUser[user_id] = summary()
                        }
                        // if (!is_voided) {
                        summaryByUser[user_id].subtotal += subtotal
                        summaryByUser[user_id].tax += tax
                        // }
                        summaryByUser[user_id].items.push({
                            caption,
                            subtotal,
                            isPaid,
                            ...is_redistributed ? {
                                name: 'Partial ' + name + ' (charged)',
                                num: 1,
                                denom: 1,
                            } : {
                                name: name + ' (charged)',
                                num: charged_units[user_id].length,
                                denom,
                            }
                        })
                    })
                }

                const {
                    user_id,
                    summary: {
                        subtotal,
                        tax,
                    },
                } = billItems[bill_item_id]

                const itemSummary = {
                    name,
                    caption,
                    subtotal,
                    num: 1,
                    denom: 1,
                    isPaid,
                }

                tableSummary.subtotal += subtotal
                tableSummary.tax += tax
                tableSummary.items.push(itemSummary)

                if (!isReceipt) { // WHO ORDERED WHAT
                    if (user_id) {
                        if (!summaryByUser[user_id]) {
                            summaryByUser[user_id] = summary()
                        }
                        summaryByUser[user_id].subtotal += subtotal
                        summaryByUser[user_id].tax += tax
                        summaryByUser[user_id].items.push(itemSummary)
                    }
                    else {
                        serverSummary.subtotal += subtotal
                        serverSummary.tax += tax
                        serverSummary.items.push(itemSummary)
                    }
                }
            })


        tableSummary.items = tableSummary.items.reduce(reduceGroupFraction, [])

        Object.keys(summaryByUser).forEach(user_id => {
            summaryByUser[user_id].items = summaryByUser[user_id].items.reduce(reduceGroupFraction, [])
        })

        serverSummary.items = serverSummary.items.reduce(reduceGroupFraction, [])

        return [
            tableSummary,
            ...!!summaryByUser[myID] ? [{
                ...summaryByUser[myID],
                id: myID,
                name: 'You',
            }] : [],
            ...Object.keys(summaryByUser).filter(id => id !== myID).map(id => {
                return { ...summaryByUser[id], id, name: billUserNames[id] }
            }),
            ...!!serverSummary.items.length ? [serverSummary] : []
        ] || emptyArray
    }
)