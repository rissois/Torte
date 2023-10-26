import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'
import { selectNestedFieldFromBill } from './selectorsBills'

const emptyObject = {}
const emptyArray = []

export const selectTable = table_id => createSelector(
    state => state.tables,
    tables => tables[table_id] ?? emptyObject
)

export const selectTablesAlphabetically = createSelector(
    state => state.tables,
    tables => Object.keys(tables).sort((a, b) => tables[a].position - tables[b].position) || emptyArray
)

export const selectTableName = (table_id) => createSelector(
    selectTable(table_id),
    table => table.name || 'Unknown'
)