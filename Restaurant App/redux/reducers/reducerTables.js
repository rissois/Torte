const initialTables = {}

// MAKE SURE TO ADD DATE FOR BILLS!! maybe bill items too...

export default function tables(state = initialTables, action) {
    switch (action.type) {
        case 'tables/SET_TABLES':
            return { ...state, ...action.obj }
        case 'tables/DELETE_TABLES':
            const tables = { ...state }
            Object.keys(action.obj).forEach(id => delete tables[id])
            return tables
        case 'app/RESET':
            return initialTables
        default:
            return state;
    }
}

