const initialApp = {
    connect_id: null,
    test_mode: !!__DEV__,
};

export default function app(state = initialApp, action) {
    switch (action.type) {
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