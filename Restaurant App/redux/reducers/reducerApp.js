const initialApp = {
    dietaryFilters: [],
    connect_id: null,
    test_mode: !!__DEV__,
    employee_id: '',
    is_admin: false, // From FIREBASE AUTH
};

export default function app(state = initialApp, action) {
    switch (action.type) {
        case 'app/TOGGLE_DIETARY_TABLE_FILTER':
            return {
                ...state,
                dietaryFilters: state.dietaryFilters.includes(action.filter) ? state.dietaryFilters.filter(filter => filter !== action.filter) : [...state.dietaryFilters, action.filter]
            }
        case 'app/CLEAR_DIETARY_TABLE':
            return {
                ...state,
                dietaryFilters: []
            }
        case 'app/SET_IS_ADMIN':
            return {
                ...state,
                is_admin: action.is_admin
            }
        case 'app/SET_EMPLOYEE':
            return {
                ...state,
                employee_id: action.employee_id
            }
        case 'app/CLEAR_EMPLOYEE':
            return {
                ...state,
                employee_id: null
            }
        case 'app/SET_STRIPE_PROVIDER':
            return {
                ...state,
                connect_id: action.connect_id
            }
        case 'app/CLEAR_STRIPE_PROVIDER':
            return {
                ...state,
                connect_id: null
            }
        case 'app/SET_STRIPE_TEST_MODE':
            return {
                ...state,
                test_mode: action.test_mode,
            }
        case 'app/RESET':
            return initialApp
        default:
            return state;
    }
}