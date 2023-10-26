import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'

const emptyObject = {}

export const selectPrivates = state => state.privates
export const selectPrivateDocument = (id) => createSelector(
    selectPrivates,
    privates => privates[id] ?? emptyObject
)

export const selectNestedFieldFromPrivateDoc = (id, ...fields) => createSelector(
    selectPrivateDocument(id),
    privateDoc => recursiveFieldGetter(privateDoc, ...fields)
)


export const selectPrinters = state => state.privates.printers

export const selectAlphabeticalPrinterIDs = createSelector(
    selectPrinters,
    printers => Object.keys(printers).sort((a, b) => printers[a].name > printers[b].name)
)

export const selectPrinter = (printer_id) => createSelector(
    selectPrinters,
    printers => printers[printer_id] ?? emptyObject
)