const initialBillItems = {}

// MAKE SURE TO ADD DATE FOR BILLS!! maybe bill items too...

export default function billItems(state = initialBillItems, action) {
    switch (action.type) {
        case 'billItems/SET_BILLITEMS':
        case 'billItems/SET_BILLITEMS_TEMP': {
            const billItems = { ...state }
            Object.keys(action.obj).forEach(bill_item_id => {
                const { bill_id } = action.obj[bill_item_id]
                if (!billItems[bill_id]) billItems[bill_id] = {}
                billItems[bill_id][bill_item_id] = action.obj[bill_item_id]
            })
            return billItems
        }
        case 'billItems/DELETE_BILLITEMS': {
            const billItems = { ...state }
            Object.keys(action.obj).forEach(bill_item_id => {
                const { bill_id } = action.obj[bill_item_id]
                delete billItems[bill_id]?.[bill_item_id]
                if (!billItems[bill_id] || !Object.keys(billItems[bill_id]).length) delete billItems[bill_id]
            })
            return billItems
        }
        case 'billItems/DELETE_BILLITEMS_TEMP': {
            const bill_id = action.bill_id
            if (state[bill_id]) {
                const bills = { ...state }
                delete bills[bill_id]
                return bills
            }
            return state
        }
        case 'app/RESET':
            return initialBillItems
        default:
            return state;
    }
}