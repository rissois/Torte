const initialEmployees = {}

// MAKE SURE TO ADD DATE FOR BILLS!! maybe bill items too...

export default function employees(state = initialEmployees, action) {
    switch (action.type) {
        case 'employees/SET_EMPLOYEES':
            return { ...state, ...action.obj }
        case 'employees/DELETE_EMPLOYEES':
            const employees = { ...state }
            Object.keys(action.obj).forEach(id => delete employees[id])
            return employees
        case 'app/RESET':
            return initialEmployees
        default:
            return state;
    }
}

