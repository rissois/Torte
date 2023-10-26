import { createSelector } from "reselect"
import { selectTrackedRestaurant, selectTrackedRestaurantRoot } from "./selectorsRestaurant2"

const emptyObject = {}
const emptyArray = []
const emptyString = ''
const emptyAddress = { line1: '', city: 'ERROR WITH ADDRESS', state: '', }

export const selectTempRestaurantName = state => state.temp.restaurant?.name ?? ''
export const selectTempRestaurantID = state => state.temp.restaurant?.id ?? ''
export const selectTempRestauranAddress = state => state.temp.restaurant?.address ?? emptyAddress
export const selectTempTableName = state => state.temp.table?.name ?? ''
export const selectTempTableID = state => state.temp.table?.id ?? ''
export const selectTempTableRestaurantName = state => state.temp.table?.restaurant?.name ?? ''
export const selectTempTableRestaurantID = state => state.temp.table?.restaurant?.id ?? ''
export const selectTempBill = state => state.temp.bill ?? null
