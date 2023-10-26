import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'

const emptyObject = {}

export const selectEmployeeID = state => state.app.employee_id

export const selectEmployee = createSelector(
    state => state.employees,
    selectEmployeeID,
    (employees, employee_id) => employees[employee_id] || emptyObject
)

export const selectEmployeeRoles = createSelector(
    selectEmployee,
    employee => employee.roles
)

// export const selectEmployee = collection => createSelector(
//     selectTrackedRestaurant,
//     restaurant => restaurant?.[collection || 'restaurant'] ?? emptyObject
// )