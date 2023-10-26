import { createSelector, } from 'reselect'

const emptyObject = {}

const selectOrderAlerts = state => state.orderAlerts ?? emptyObject

export const selectChronologicalOrderAlerts = createSelector(
    selectOrderAlerts,
    orderAlerts => Object.keys(orderAlerts)
        .sort((a, b) => orderAlerts[a].created - orderAlerts[b].created)
        .map(table_id => ({ table_id, ...orderAlerts[table_id] }))
)