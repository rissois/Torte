import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'

const emptyObject = {}
const emptyArray = []

export const selectTableStatus = table_id => createSelector(
    state => state.tableStatus,
    tableStatuses => tableStatuses[table_id] ?? emptyObject
)

export const selectOpenBillsOnTable = table_id => createSelector(
    state => state.tableStatus,
    tableStatuses => tableStatuses[table_id]?.openBills ?? emptyArray
)

// export const selectIsTableWithMultipleBills = table_id => createSelector(
//     selectOpenBillsOnTable(table_id),
//     openBills => openBills.length > 1
// )