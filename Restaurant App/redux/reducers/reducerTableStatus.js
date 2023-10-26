const initialTableStatus = {}
const tableTemplate = () => ({
    openBills: []
})

const checkIfBillIsInTable = (state, table_id, bill_id) => state[table_id]?.openBills?.includes(bill_id)

const removeBillFromOpenBills = (tables, table_id, bill_id) => {
    tables[table_id] = {
        ...tables[table_id],
        openBills: tables[table_id]?.openBills.filter(id => id !== bill_id)
    }
}

export default function tableStatus(state = initialTableStatus, action) {
    switch (action.type) {
        case 'bills/SET_BILLS': {
            let tableStatuses = { ...state }
            let isAltered = false
            Object.keys(action.obj).forEach(bill_id => {
                const { table: { id: table_id }, timestamps } = action.obj[bill_id]

                if (!tableStatuses[table_id]) tableStatuses[table_id] = tableTemplate()

                const isBillInTable = checkIfBillIsInTable(tableStatuses, table_id, bill_id)

                // Bill should not be on table
                if (timestamps.closed || timestamps.unpaid || timestamps.charged) {
                    if (isBillInTable) {
                        removeBillFromOpenBills(tableStatuses, table_id, bill_id,)
                        isAltered = true
                    }
                }
                // Bill should be on table, but is not
                else if (!isBillInTable) {
                    tableStatuses[table_id] = {
                        ...tableStatuses[table_id],
                        openBills: [...tableStatuses[table_id]?.openBills, bill_id]
                    }
                    isAltered = true
                }
            })
            if (isAltered) return tableStatuses
            return state
        }
        case 'bills/DELETE_BILLS': {
            let tableStatuses = { ...state }
            let isAltered = false
            Object.keys(action.obj).forEach(bill_id => {
                const { table: { id: table_id }, } = action.obj[bill_id]

                if (checkIfBillIsInTable(tableStatuses, table_id, bill_id)) {
                    removeBillFromOpenBills(tableStatuses, table_id, bill_id,)
                    isAltered = true
                }
            })
            if (isAltered) return tableStatuses
            return state
        }

        case 'app/RESET':
            return initialTableStatus
        default:
            return state;
    }
}

