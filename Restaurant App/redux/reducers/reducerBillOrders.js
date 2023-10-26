const initialBillOrders = {}

export default function billOrders(state = initialBillOrders, action) {
    switch (action.type) {
        case 'billOrders/SET_BILLORDERS':
            return { ...state, ...action.obj }
        case 'billOrders/DELETE_BILLORDERS':
            const billOrders = { ...state }
            Object.keys(action.obj).forEach(id => delete billOrders[id])
            return billOrders
        case 'app/RESET':
            return initialBillOrders
        default:
            return state;
    }
}