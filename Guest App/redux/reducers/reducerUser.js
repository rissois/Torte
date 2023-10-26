const userTemplate = {
    is_admin: false, // FROM FIREBASE AUTH
    user_id: '',
    id: '',
    name: '',
    acct_no: '',
    email: '',
    phone: '',
    date_joined: null,
    pos: {
        eula: {
            dates: [],
            is_needed: false,
        },
        walkthroughs: []
    },
    torte: {
        eula: {
            dates: [],
            is_needed: false,
        },
        walkthroughs: [],
        open_bills: [],
    },
    is_anonymous: true,
}

const initialUser = {
    user: userTemplate,
    coupons: {},
    spend: {},
    loyalty: {},
    cards: {},
}

export default function user(state = initialUser, action) {
    switch (action.type) {
        case 'user/SET_NAME':
            return {
                ...state,
                user: {
                    ...state.user,
                    name: action.name
                }
            }
        case 'user/UPDATE_USER_CHILDREN':
            return {
                ...state,
                [action.category]: {
                    ...state[action.category],
                    ...action.obj,
                }
            }
        case 'user/DELETE_USER_CHILDREN':
            const category = { ...state[action.category] }
            Object.keys(action.obj).forEach(id => delete category[id])
            return { ...state, [action.category]: category }
        case 'app/RESET':
            return initialUser
        default:
            return state;
    }
}