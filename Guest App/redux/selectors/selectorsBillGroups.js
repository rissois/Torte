import { createSelector } from 'reselect'
import { selectFilterSelections, selectModifierSelections, selectSizeSelection, selectUpsellSelections } from './selectorsSelections'
import { selectMyID } from './selectorsUser'

const emptyObject = {}

const identicalObjects = (a = {}, b = {}) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => a[key] === b[key])
const identicalOptions = (a = [], b = []) => a.length === b.length &&
    a.every(a_upsell => b.some(b_upsell => identicalObjects(a_upsell, b_upsell)))


export const selectBillGroups = state => state.bill.billGroups
export const selectTrackedBillGroupID = state => state.trackers.bill_group_id

export const selectBillGroup = (bill_group_id) => createSelector(
    selectBillGroups,
    billGroups => billGroups[bill_group_id] ?? emptyObject
)

export const selectTrackedBillGroup = createSelector(
    selectBillGroups,
    selectTrackedBillGroupID,
    (billGroups, bill_group_id) => billGroups[bill_group_id] ?? emptyObject
)

const identicalSizeSelections = (a = {}, b = {}) => !!b && a.code === b.code && a.name === b.name && a.price === b.price
export const selectIsSizeAltered = createSelector(
    selectTrackedBillGroup,
    selectSizeSelection,
    (billGroup, sizeSelection) => !identicalSizeSelections(billGroup.size, sizeSelection)
)

const identicalFilterSelections = (a = {}, b = {}) => identicalObjects(a, b)
export const selectIsFiltersAltered = createSelector(
    selectTrackedBillGroup,
    selectFilterSelections,
    (billGroup, filterSelections) => !identicalFilterSelections(billGroup.filters, filterSelections)
)

const identicalUpsellSelections = (a = [], b = []) => identicalOptions(a, b)
export const selectIsUpsellsAltered = createSelector(
    selectTrackedBillGroup,
    selectUpsellSelections,
    (billGroup, upsellsSelections) => !identicalUpsellSelections(billGroup.upsells, upsellsSelections)
)

const identicalModifierSelections = (a = {}, b = {}) => Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every(modifier_id => {
        const { mods: a_mods = [], ...a_modifier } = a[modifier_id]
        const { mods: b_mods = [], ...b_modifier } = b[modifier_id]
        return identicalOptions(a_mods, b_mods) && identicalObjects(a_modifier, b_modifier)
    })
export const selectIsModifiersAltered = createSelector(
    selectTrackedBillGroup,
    selectModifierSelections,
    (billGroup, modifierSelection) => !identicalModifierSelections(billGroup.modifiers, modifierSelection)
)

export const selectIsBillGroupSelectionsAltered = createSelector(
    selectIsSizeAltered,
    selectIsFiltersAltered,
    selectIsUpsellsAltered,
    selectIsModifiersAltered,
    (a, b, c, d) => a || b || c || d
)

export const selectIsEditableByMe = createSelector(
    selectTrackedBillGroup,
    selectMyID,
    (billGroup, myID) => !billGroup.user_id || billGroup.user_id === myID
)

export const selectMyBillGroupIDs = createSelector(
    selectBillGroups,
    selectMyID,
    (billGroups, myID) => Object.keys(billGroups).filter(bill_group_id => {
        const billGroup = billGroups[bill_group_id]
        return billGroup.user_id === myID && !billGroup.timestamps.itemized && !billGroup.timestamps.ordered
    })
)

export const selectNumberOfItemsInCart = createSelector(
    selectBillGroups,
    selectMyID,
    (billGroups, myID) => Object.keys(billGroups).reduce((acc, bill_group_id) => {
        const billGroup = billGroups[bill_group_id]
        if (billGroup.user_id === myID && !billGroup.timestamps.itemized && !billGroup.timestamps.ordered) return acc + billGroup.quantity
        return acc
    }, 0)
)

export const selectCarts = (isOnlyOrdered) => createSelector(
    selectBillGroups,
    selectMyID,
    (billGroups, myID) => {
        const cartsByUserID = Object.keys(billGroups).reduce((acc, bill_group_id) => {
            const billGroup = billGroups[bill_group_id]

            if (!billGroup.timestamps.itemized && (billGroup.timestamps.ordered || !isOnlyOrdered)) {
                const user_id = billGroup.user_id
                if (!acc[user_id]) acc[user_id] = { data: [], subtotal: 0 }
                acc[user_id].data.push(bill_group_id)
                acc[user_id].subtotal += billGroup.summary.subtotal * billGroup.quantity
            }
            return acc
        }, {})

        if (!isOnlyOrdered && !cartsByUserID[myID]) cartsByUserID[myID] = { data: [], }

        return Object.keys(cartsByUserID).sort(user_id => -(user_id === myID)).map(user_id => ({ user_id, ...cartsByUserID[user_id] }))
    }
)




