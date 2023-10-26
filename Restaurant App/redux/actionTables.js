import { setTableOrder } from "./actionsSystem"

export const SET_TABLE = 'SET_TABLE'
export const DELETE_TABLE = 'DELETE_TABLE'

export function setTable(table_id, data) {
    return async function (dispatch, getState) {
        dispatch(addTable(table_id, data))

        dispatch(checkTableOrder())
    }
}

function addTable(table_id, data) {
    // console.log('set table: ', table_id)
    return { type: SET_TABLE, table_id, data }
}

export function checkTableOrder(bulk_tables) {
    return async function (dispatch, getState) {
        const tables = bulk_tables ?? getState().tables
        dispatch(setTableOrder(Object.keys(tables).filter(table_id => tables[table_id].table_details.code !== 'MN').sort((a, b) => tables[a].table_details.code.toUpperCase() > tables[b].table_details.code.toUpperCase())))
    }
}

export function deleteTable(table_id) {
    return async function (dispatch, getState) {
        dispatch(removeTable(table_id))
        dispatch(checkTableOrder())
    }
}

export function removeTable(table_id) {
    console.log('delete table: ', table_id)
    return { type: DELETE_TABLE, table_id }
}