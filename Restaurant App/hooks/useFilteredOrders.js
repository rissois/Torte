import { useSelector, } from 'react-redux';
import { filterTableModes } from '../constants/filterTableModes'
// JUST RETURN BILLS BY TABLE

export default function useFilteredOrders() {
  const orders_listener_complete = useSelector(state => state.app.listener_complete.orders)
  const user = useSelector(state => state.user)
  const employee = useSelector(state => state.employees[state.user])
  const orders = useSelector(state => state.orders)

  if (!orders_listener_complete) {
    return ({
      untransferredByTable: {},
      transferredByTable: {},
      transferredByBill: {},
    })
  }

  let untransferredByTable = {}
  let transferredByTable = {}
  let transferredByBill = {}


  switch (employee?.filterTables ?? filterTableModes.all) {
    case filterTableModes.all: {
      Object.keys(orders).forEach(id => addOrder(orders[id], untransferredByTable, transferredByTable, transferredByBill,))
      break
    }
    case filterTableModes.open: {
      Object.keys(orders).forEach(id => {
        if (!orders[id].server_id || orders[id].server_id === user) {
          addOrder(orders[id], untransferredByTable, transferredByTable, transferredByBill,)
        }
      })
      break
    }
    case filterTableModes.self: {
      Object.keys(orders).forEach(id => {
        if (orders[id].server_id === user) {
          addOrder(orders[id], untransferredByTable, transferredByTable, transferredByBill,)
        }
      })
      break
    }
  }

  sortGrouped(untransferredByTable)
  sortGrouped(transferredByTable, false)
  sortGrouped(transferredByBill, false)

  return ({
    untransferredByTable,
    transferredByTable,
    transferredByBill,
    longestWaitingTables: sortKeysByTime(untransferredByTable),
    latestTransferredTables: sortKeysByTime(transferredByTable, false),
    latestTransferredBills: sortKeysByTime(transferredByBill, false),
  })
}

const addOrder = (order, ubt, tbt, tbb) => {
  const mini = {
    server_id: order.server_details.id,
    bill_id: order.bill_id,
    ref_code: order.ref_code,
    table_name: order.table_details.name,
    table_id: order.table_details.id,
    time: (order.transferred || order.submission_time).toMillis(),
    order_id: order.order_id
  }


  if (order.transferred) {
    if (!tbt[mini.table_id]) {
      tbt[mini.table_id] = [mini]
    }
    else {
      tbt[mini.table_id].push(mini)
    }

    if (!tbb[mini.bill_id]) {
      tbb[mini.bill_id] = [mini]
    }
    else {
      tbb[mini.bill_id].push(mini)
    }
  }
  else {
    if (!ubt[mini.table_id]) {
      ubt[mini.table_id] = [mini]
    }
    else {
      ubt[mini.table_id].push(mini)
    }
  }
}

const sortGrouped = (statusGroup, asc) => {
  Object.keys(statusGroup).forEach(group_id => {
    statusGroup[group_id] = sortOrdersByTime(statusGroup[group_id], asc)
  })

  return statusGroup
}

const sortOrdersByTime = (order, asc = true) => {
  return order.sort((a, b) => {
    if (asc) return a.time - b.time
    return b.time - a.time
  })
}

const sortKeysByTime = (object, asc = true) => {
  return Object.keys(object).sort((a, b) => {
    if (asc) return object[a][0].time - object[b][0].time
    return object[b][0].time - object[a][0].time
  })
}