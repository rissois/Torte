export const initialFirestore = {

}

export default function firestore(state = initialFirestore, action) {
    switch (action.type) {
        case 'app/RESET':
            return initialFirestore;
        default:
            return state;
    }
}