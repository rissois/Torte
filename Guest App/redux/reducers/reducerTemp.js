const initialTemp = {
    restaurant: null,
    table: null,
};

export default function table(state = initialTemp, action) {
    switch (action.type) {
        case 'temp/SET_RESTAURANT':
            return {
                ...initialTemp,
                restaurant: action.restaurant,
                table: action.table,
            }
        case 'temp/SET_TABLE':
            return {
                ...state,
                table: action.table,
                bill: action.bill,
            }
        case 'temp/SET_BILL':
            return {
                ...state,
                bill: action.bill,
            }
        case 'temp/REMOVE_BILL':
            return {
                ...state,
                bill: null,
            }
        case 'temp/REMOVE_TABLE':
            return {
                ...state,
                table: null,
                bill: null,
            }
        case 'temp/REMOVE_RESTAURANT':
        case 'app/RESET':
            return initialTemp
        default:
            return state;
    }
}