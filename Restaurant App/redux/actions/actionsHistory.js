export const doBillsTempSet = (obj) => {
    return { type: 'bills/SET_BILLS_TEMP', obj }
}

export const doBillsTempClear = () => {
    return { type: 'bills/DELETE_BILLS_TEMP' }
}

export const doBillItemsTempSet = (obj) => {
    return { type: 'billItems/SET_BILLITEMS_TEMP', obj }
}

export const doBillItemsTempClear = (bill_id) => {
    return { type: 'billItems/DELETE_BILLITEMS_TEMP', bill_id }
}