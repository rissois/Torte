import React, { useState, useEffect, } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { filterTableModes } from '../constants/filterTableModes'
// JUST RETURN BILLS BY TABLE

export default function useFilteredBills() {
  const bills_listener_complete = useSelector(state => state.app.listener_complete.bills)

  const user = useSelector(state => state.user)
  const employee = useSelector(state => state.employees[state.user])
  const minibills = useSelector(state => state.minibills, shallowEqual)

  if (!bills_listener_complete) {
    return ({
      openBillsInTables: {},
      closedBills: [],
      unpaidBills: [],
      notOpenBills: []
    })
  }

  const open = {}
  const closed = {}
  const unpaid = {}

  switch (employee?.filterTables ?? filterTableModes.all) {
    case filterTableModes.all: {
      Object.keys(minibills).forEach(id => addBill(minibills[id], open, closed, unpaid))
      break
    }
    case filterTableModes.open: {
      Object.keys(minibills).forEach(id => {
        if (!minibills[id].server_id || minibills[id].server_id === user) {
          addBill(minibills[id], open, closed, unpaid)
        }
      })
      break
    }
    case filterTableModes.self: {
      Object.keys(minibills).forEach(id => {
        if (minibills[id].server_id === user) {
          addBill(minibills[id], open, closed, unpaid)
        }
      })
      break
    }
  }

  return ({
    openBillsInTables: sortTableBills(open), // sorting may not be required... but unlikely to have multiple anyways
    closedBills: sortBillsByCreated(Object.values(closed).flat(), false),
    unpaidBills: sortBillsByCreated(Object.values(unpaid).flat(), false),
    notOpenBills: sortBillsByCreated(Object.values(unpaid).concat(Object.values(closed)).flat(), false)
  })
}

const addBill = (minibill, open, closed, unpaid) => {
  switch (minibill.status) {
    case 'open': {
      if (!open[minibill.table_id]) {
        open[minibill.table_id] = [minibill]
      }
      else {
        open[minibill.table_id].push(minibill)
      }

      break
    }
    case 'closed': {
      if (!closed[minibill.table_id]) {
        closed[minibill.table_id] = [minibill]
      }
      else {
        closed[minibill.table_id].push(minibill)
      }

      break
    }
    case 'unpaid': {
      if (!unpaid[minibill.table_id]) {
        unpaid[minibill.table_id] = [minibill]
      }
      else {
        unpaid[minibill.table_id].push(minibill)
      }

      break
    }
  }
}

const sortTableBills = (statusGroup, asc) => {
  Object.keys(statusGroup).forEach(table_id => {
    statusGroup[table_id] = sortBillsByCreated(statusGroup[table_id], asc)
  })

  return statusGroup
}

const sortBillsByCreated = (bills, asc = true) => {
  return bills.sort((a, b) => {
    if (asc) return a.created - b.created
    return b.created - a.created
  }).map(({ bill_id }) => bill_id)
}