import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'
import { createShallowEqualSelector } from './selectorCreators'
import { selectMyOrderSubtotal } from './selectorsReceiptUsers'
import { selectMyID } from './selectorsUser'

const emptyObject = {}
const emptyArray = []

export const selectReceipt = state => state.receipt.receipt ?? emptyObject
export const selectReceiptIsApproved = createSelector(
    selectReceipt,
    receipt => !!receipt.is_approved
)



export const selectReceiptOrCollection = collection => createSelector(
    state => state.receipt,
    receipt => receipt?.[collection || 'receipt'] ?? emptyObject
)

export const selectDocumentFromReceiptCollection = (collection, id) => createSelector(
    selectReceiptOrCollection(collection),
    collection => collection?.[id] ?? emptyObject
)

export const selectNestedFieldFromReceipt = (...fields) => createSelector(
    selectReceipt,
    receipt => recursiveFieldGetter(receipt, ...fields)
)

export const selectNestedFieldFromReceiptCollection = (collection, id, ...fields) => createSelector(
    selectDocumentFromReceiptCollection(collection, id),
    document => recursiveFieldGetter(document, ...fields)
)

/*
    BASIC BILL DETAILS
*/

export const selectReceiptID = createSelector(
    selectReceipt,
    receipt => receipt?.id || ''
)

export const selectRestaurantName = createSelector(
    selectReceipt,
    receipt => receipt?.restaurant?.name || '(restaurant name)'
)

export const selectReceiptCreator = createSelector(
    selectReceipt,
    ({ user_status = {} }) => Object.keys(user_status).find(user_id => user_status[user_id].is_editor) || ''
)

export const selectIsReceiptEditor = createSelector(
    selectReceipt,
    selectMyID,
    (receipt, myID) => receipt.user_status?.[myID]?.is_editor
)

export const selectReceiptSubtotal = createSelector(
    selectReceipt,
    receipt => receipt?.summary?.subtotal || 0
)

export const selectReceiptTax = createSelector(
    selectReceipt,
    receipt => receipt?.summary?.tax || 0
)

export const selectReceiptGratuity = createSelector(
    selectReceipt,
    receipt => receipt?.summary?.gratuity || 0
)


export const selectReceiptCreatedAsDate = createSelector(
    selectReceipt,
    receipt => receipt?.timestamps?.created?.toDate() || new Date()
)

export const selectReceiptUserIDs = createSelector(
    selectReceipt,
    selectMyID,
    ({ user_ids = [] }, myID) => [myID, ...user_ids.filter(id => id !== myID)]
)

export const selectReceiptUserNames = createSelector(
    selectReceipt,
    ({ user_status = {} }) => Object.keys(user_status).reduce((acc, user_id) => ({ ...acc, [user_id]: user_status[user_id]?.name || 'unknown' }), {}) ?? emptyObject
)


export const selectReceiptUserName = (user_id) => createShallowEqualSelector(
    selectMyID,
    selectReceiptUserNames,
    (myID, receiptUserNames) => myID === user_id ? 'You' : receiptUserNames[user_id] || ''
)

export const selectReceiptEditSummary = createSelector(
    selectReceipt,
    ({ summary }) => summary
)
