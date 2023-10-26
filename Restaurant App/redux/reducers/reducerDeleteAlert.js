const initialDelete = '';

export default function deleteAlert(state = initialDelete, action) {
    // Not sure how to handle this atomically
    switch (action.type) {
        case 'delete/START_DELETE_CHILD':
            return action.name
        case 'delete/END_DELETE_CHILD':
            if (action.name === state) return initialDelete
            return state
        case 'delete/RESET_DELETE_CHILD':
        case 'app/RESET':
            return initialDelete
        default:
            return state
    }
}