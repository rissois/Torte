import { createSelector } from 'reselect'
import { createShallowEqualSelector } from './selectorCreators'
import { selectReceiptUserIDs, selectReceiptUserNames } from './selectorsReceipt'
import { selectMyID } from './selectorsUser'

const emptyObject = {}
const emptyArray = []

export const selectReceiptItems = state => state.receipt.receiptItems
export const selectReceiptItemIDsSorted = createSelector(
    selectReceiptItems,
    receiptItems => Object.keys(receiptItems).sort((a, b) => {
        if (receiptItems[a].position === receiptItems[b].position) return a - b
        return receiptItems[a].position - receiptItems[b].position
    })
)

export const selectReceiptItem = (receipt_item_id) => createSelector(
    selectReceiptItems,
    receiptItems => receiptItems[receipt_item_id] ?? emptyObject
)

export const selectReceiptItemIDs = createSelector(
    selectReceiptItems,
    receiptItems => Object.keys(receiptItems).sort((a, b) => {
        return (receiptItems[a].position - receiptItems[b].position)
            || (a - b)
    })
)

export const selectReceiptItemSplitDetails = (receipt_item_id) => createSelector(
    selectReceiptItem(receipt_item_id),
    selectMyID,
    (receiptItem, myID) => [
        receiptItem.name,
        receiptItem.captions?.join(' / ') || '',
        receiptItem.summary?.subtotal || 0,
        receiptItem.units?.denom || 1,
        receiptItem.units?.available.length || 0,
        receiptItem.units?.claimed[myID]?.length || 0,
        receiptItem.units?.claimed[myID]?.reduce((acc, { subtotal }) => acc + subtotal, 0) || 0,
    ]

    /*
    [name, caption, subtotal, denom,  availableLength, myClaimedLength, myClaimedSubtotal, ]
    */
)

// ??? A redux-based approached requires less computation, captions will always trigger re-render
export const selectReceiptGroups = createSelector(
    selectReceiptItems,
    receiptItems => {
        let groups = []

        Object.keys(receiptItems).forEach(receiptItemID => {
            const item = receiptItems[receiptItemID]
            const isClaimed = Object.keys(item.units.claimed).length

            // Name and captions more rigorous...
            const matchingIndex = groups.findIndex(group => group.position === item.position)
            if (~matchingIndex) {
                groups[matchingIndex].quantity++
                groups[matchingIndex][isClaimed ? 'claimed' : 'unclaimed'].push(receiptItemID)
            }
            else {
                groups.push({
                    name: item.name,
                    quantity: 1,
                    captions: item.captions,
                    position: item.position,
                    subtotal: item.summary.subtotal,
                    claimed: [],
                    unclaimed: [],
                    [isClaimed ? 'claimed' : 'unclaimed']: [receiptItemID]
                })
            }
        })

        return groups.sort((a, b) => a.position - b.position)
    }
)

const summary = () => ({
    subtotal: 0,
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
    const prevIndex = acc.findIndex(({ name, caption, }) => name === group.name && caption === group.caption)
    if (~prevIndex) {
        let hold = [...acc]
        hold.splice(prevIndex, 1, { ...acc[prevIndex], subtotal: acc[prevIndex].subtotal + group.subtotal, ...addFractions(acc[prevIndex].num, acc[prevIndex].denom, group.num, group.denom) })
        return hold
    }
    return [...acc, group]
}

export const selectReceiptSummaries = createSelector(
    selectReceiptItems,
    selectReceiptUserIDs,
    (receiptItems, user_ids) => {
        let tableSummary = summary()
        let summaryByUser = user_ids.reduce((obj, user_id) => ({ ...obj, [user_id]: summary() }), {})

        Object.keys(receiptItems)
            .sort((a, b) => receiptItems[a].position - receiptItems[b].position)
            .forEach(receipt_item_id => {

                const {
                    units: { denom, claimed, available },
                    captions,
                    name,
                    summary: {
                        subtotal,
                    },
                } = receiptItems[receipt_item_id]

                const caption = captions.join('\n')

                Object.keys(claimed).forEach(user_id => {
                    const userSubtotal = claimed[user_id].reduce((sum, { subtotal }) => sum + subtotal, 0)

                    if (!summaryByUser[user_id]) {
                        summaryByUser[user_id] = summary()
                    }

                    summaryByUser[user_id].subtotal += userSubtotal
                    summaryByUser[user_id].items.push({
                        name,
                        caption,
                        subtotal: userSubtotal,
                        num: claimed[user_id].length,
                        denom,
                    })
                })

                tableSummary.subtotal += subtotal
                tableSummary.items.push({
                    name,
                    caption,
                    subtotal,
                    num: 1,
                    denom: 1,
                    isAvailable: !!available.length
                })
            })

        tableSummary.items = tableSummary.items.reduce(reduceGroupFraction, [])

        Object.keys(summaryByUser).forEach(user_id => {
            summaryByUser[user_id].items = summaryByUser[user_id].items.reduce(reduceGroupFraction, [])
        })

        return {
            'table': tableSummary,
            ...summaryByUser
        }
    }
)