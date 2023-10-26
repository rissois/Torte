import { combineReducers } from 'redux';
import { SET_RESTAURANT } from './actionsRestaurant';
import { SET_PRIVATE_DOC } from './actionsPrivate';
import { UPLOAD_START, UPLOAD_PROGRESS, UPLOAD_SUCCESS, UPLOAD_FAILURE, FETCH_START, FETCH_SUCCESS, FETCH_FAILURE, DELETE_PHOTO, UPLOAD_TASK, UPLOAD_CANCEL, DELETE_SUCCESS, DELETE_FAILURE, FETCH_DOWNLOAD, DELETE_START, NO_PHOTO } from './actionsPhotos'
import { SET_ITEM, SET_SOLD_OUT_ITEMS } from './actionsItems';
import { CLEAR_TRACKER, REMOVE_TRACKER, SET_TRACKER, } from './actionsTracker';
import { SET_USER, CLEAR_USER } from './actionsEmployees';
import { SET_TABLE_ORDER, CLEAR_LISTENER_TIME, SET_LISTENER_TIME, SET_LISTENER_TIME_TIMEOUT } from './actionsSystem';
import { SET_TABLE } from './actionTables';
import { ALERT_BILL, SET_BILL, } from './actionsBills';
import { SET_ORDER_CHECKS, SET_ORDER_WRITING } from './actionsOrders';
import { LISTENER_COMPLETE, CHANGE_RESTAURANT, CLEAR_FROM_CATEGORY, BULK_SET_CATEGORY, UPDATE_FROM_CATEGORY } from './actionsApp';

const initialApp = {
    listener_complete: {
        restaurant: false,
        private: false,
        tables: false,
        employees: false,
        menus: false,
        sections: false,
        items: false,
        photoAds: false,
        specifications: false,
        modifications: false,
        bills: false,
        carts: false,
        orders: false,
    }
}

function app(state = initialApp, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return initialApp
        case LISTENER_COMPLETE:
            return {
                ...state,
                listener_complete: {
                    ...state.listener_complete,
                    [action.category]: true
                }
            }
        default:
            return state;
    }
}

function restaurant(state = {}, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return { restaurant_id: action.restaurant_id }
        case SET_RESTAURANT:
            return action.restaurant
        default:
            return state;
    }
}

function employees(state = {}, action) {
    switch (action.type) {
        case BULK_SET_CATEGORY:
            if (action.category === 'employees') {
                return action.bulk
            }
            return state
        case UPDATE_FROM_CATEGORY:
            if (action.category === 'employees') {
                return {
                    ...state,
                    [action.id]: action.data
                }
            }
            return state
        case CLEAR_FROM_CATEGORY:
            if (action.category === 'employees') {
                let { [action.id]: discard, ...rest } = state
                return rest
            }
            return state
        case CHANGE_RESTAURANT:
            return {}
        default:
            return state;
    }
}

function tables(state = {}, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return {}
        case BULK_SET_CATEGORY:
            if (action.category === 'tables') {
                return action.bulk
            }
            return state
        case UPDATE_FROM_CATEGORY:
            if (action.category === 'tables') {
                return {
                    ...state,
                    [action.id]: action.data
                }
            }
            return state
        case CLEAR_FROM_CATEGORY:
            if (action.category === 'tables') {
                let { [action.id]: discard, ...rest } = state
                return rest
            }
            return state
        default:
            return state;
    }
}
//__DEV__ ? 'lraYFZjQjhlx87wC9u7o' : 
function user(state = '', action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return ''
        case SET_USER:
            return action.employee_id
        case CLEAR_USER:
            return ''
        default:
            return state;
    }
}



function photos(state = {}, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return {}
        case UPLOAD_START: {
            return {
                ...state,
                [action.item_id]: {
                    name: action.name,
                    upload: {
                        blobbing: true,
                    },
                    del: {},
                    fetch: {},
                    uri: action.local_uri
                }
            }
        }
        case UPLOAD_TASK: {
            return {
                ...state,
                [action.item_id]: {
                    ...state[action.item_id],
                    upload: {
                        upload_task: action.upload_task,
                        upload_progress: 0,
                    }
                }
            }
        }
        case UPLOAD_PROGRESS: {
            return {
                ...state,
                [action.item_id]: {
                    ...state[action.item_id],
                    upload: {
                        ...state[action.item_id].upload,
                        upload_progress: action.progress,
                    }
                }
            }
        }
        case UPLOAD_SUCCESS: {
            return {
                ...state,
                [action.item_id]: {
                    ...state[action.item_id],
                    upload: {},
                }
            }
        }
        case UPLOAD_CANCEL: {
            // URI, turn off fetching
            return {
                ...state,
                [action.item_id]: {
                    ...state[action.item_id],
                    upload: {
                        upload_cancel: true
                    },
                    uri: null,
                }
            }
        }
        case UPLOAD_FAILURE: {
            return {
                ...state,
                [action.item_id]: {
                    ...state[action.item_id],
                    upload: {
                        upload_fail: action.message ?? true
                    },
                    uri: null,
                }
            }
        }
        case FETCH_START: {
            return {
                ...state,
                [action.item_id]: {
                    ...state[action.item_id],
                    name: action.name,
                    fetch: {
                        dating: true,
                    },
                    upload: {},
                    del: {},
                }
            }
        }
        case FETCH_DOWNLOAD: {
            return {
                ...state,
                [action.item_id]: {
                    ...state[action.item_id],
                    fetch: {
                        downloading: true,
                    }
                }
            }
        }
        case FETCH_SUCCESS: {
            return {
                ...state,
                [action.item_id]: {
                    ...state[action.item_id],
                    fetch: {
                        // time: new Date(),
                    },
                    uri: action.uri,
                }
            }
        }
        case FETCH_FAILURE: {
            // Broken, turn off fetching... can keep URI?
            return {
                ...state,
                [action.item_id]: {
                    ...state[action.item_id],
                    fetch: {
                        fetch_fail: action.message ?? 'Could not find photo.'
                    }
                }
            }
        }
        case DELETE_START: {
            return {
                ...state,
                [action.item_id]: {
                    ...state[action.item_id],
                    del: {
                        deleting: true,
                    },
                    upload: {},
                    fetch: {},
                }
            }
        }
        case NO_PHOTO:
        case DELETE_SUCCESS: {
            let { [action.item_id]: discard, ...rest } = state
            return {
                ...rest,
            }
        }
        case DELETE_FAILURE: {
            return {
                ...state,
                [action.item_id]: {
                    ...state[action.item_id],
                    del: {
                        delete_fail: true
                    }
                }
            }
        }
        default:
            return state;
    }
}

function privateDocs(state = {}, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return {}
        case SET_PRIVATE_DOC:
            return {
                ...state,
                [action.name]: action.data
            }
        default:
            return state;
    }
}

// function meals(state = {}, action) {
//     switch (action.type) {
//         case SET_MEAL:
//             return {
//                 ...state,
//                 [action.meal_id]: action.data
//             };
//         case DELETE_MEAL:
//             let { [action.meal_id]: discard, ...rest } = state
//             return rest
//         default:
//             return state;
//     }
// }

function menus(state = {}, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return {}
        case BULK_SET_CATEGORY:
            if (action.category === 'menus') {
                return action.bulk
            }
            return state
        case UPDATE_FROM_CATEGORY:
            if (action.category === 'menus') {
                return {
                    ...state,
                    [action.id]: action.data
                }
            }
            return state
        case CLEAR_FROM_CATEGORY:
            if (action.category === 'menus') {
                let { [action.id]: discard, ...rest } = state
                return rest
            }
            return state
        default:
            return state;
    }
}

function sections(state = {}, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return {}
        case BULK_SET_CATEGORY:
            if (action.category === 'sections') {
                return action.bulk
            }
            return state
        case UPDATE_FROM_CATEGORY:
            if (action.category === 'sections') {
                return {
                    ...state,
                    [action.id]: action.data
                }
            }
            return state
        case CLEAR_FROM_CATEGORY:
            if (action.category === 'sections') {
                let { [action.id]: discard, ...rest } = state
                return rest
            }
            return state
        default:
            return state;
    }
}

function items(state = {}, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return {}
        case SET_ITEM:
            return {
                ...state,
                [action.item_id]: action.data
            };
        case CLEAR_FROM_CATEGORY:
            if (action.category === 'items') {
                let { [action.id]: discard, ...rest } = state
                return rest
            }
            return state
        default:
            return state;
    }
}

function photoAds(state = {}, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return {}
        case BULK_SET_CATEGORY:
            if (action.category === 'photoAds') {
                return action.bulk
            }
            return state
        case UPDATE_FROM_CATEGORY:
            if (action.category === 'photoAds') {
                return {
                    ...state,
                    [action.id]: action.data
                }
            }
            return state
        case CLEAR_FROM_CATEGORY:
            if (action.category === 'photoAds') {
                let { [action.id]: discard, ...rest } = state
                return rest
            }
            return state
        default:
            return state;
    }
}

function specifications(state = {}, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return {}
        case BULK_SET_CATEGORY:
            if (action.category === 'specifications') {
                return action.bulk
            }
            return state
        case UPDATE_FROM_CATEGORY:
            if (action.category === 'specifications') {
                return {
                    ...state,
                    [action.id]: action.data
                }
            }
            return state
        case CLEAR_FROM_CATEGORY:
            if (action.category === 'specifications') {
                let { [action.id]: discard, ...rest } = state
                return rest
            }
            return state
        default:
            return state;
    }
}

function modifications(state = {}, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return {}
        case BULK_SET_CATEGORY:
            if (action.category === 'modifications') {
                return action.bulk
            }
            return state
        case UPDATE_FROM_CATEGORY:
            if (action.category === 'modifications') {
                return {
                    ...state,
                    [action.id]: action.data
                }
            }
            return state
        case CLEAR_FROM_CATEGORY:
            if (action.category === 'modifications') {
                let { [action.id]: discard, ...rest } = state
                return rest
            }
            return state
        default:
            return state;
    }
}

const initialTracker = { menu: null, section: null, item: null, modification: null, specification: null, dayIndex: -1, serviceIndex: -1 }
function tracker(state = initialTracker, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return initialTracker
        case CLEAR_TRACKER:
            return initialTracker;
        case SET_TRACKER:
            return { ...state, ...action.payload }
        case REMOVE_TRACKER:
            if (action.category.includes('Index')) {
                return { ...state, [action.category]: -1 }
            }
            return { ...state, [action.category]: null }
        default:
            return state;
    }
}

function bills(state = {}, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return {}
        case SET_BILL:
            return {
                ...state,
                [action.bill_id]: action.data
            };
        case CLEAR_FROM_CATEGORY:
            if (action.category === 'bills') {
                let { [action.id]: discard, ...rest } = state
                return rest
            }
            return state
        default:
            return state;
    }
}

function minibills(state = {}, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return {}
        case SET_BILL:
            return {
                ...state,
                [action.bill_id]: action.mini
            };
        case CLEAR_FROM_CATEGORY:
            if (action.category === 'bills') {
                let { [action.id]: discard, ...rest } = state
                return rest
            }
            return state
        default:
            return state;
    }
}

function alerts(state = {}, action) {
    switch (action.type) {
        case ALERT_BILL:
            return {
                ...state,
                [action.bill_id]: {
                    ...state[action.bill_id],
                    [action.field]: action.value
                }
            }
        case CLEAR_FROM_CATEGORY:
            if (action.category === 'bills') {
                let { [action.id]: discard, ...rest } = state
                return rest
            }
            return state
        default:
            return state;
    }
}

function carts(state = {}, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return {}
        case BULK_SET_CATEGORY:
            if (action.category === 'carts') {
                return action.bulk
            }
            return state
        case UPDATE_FROM_CATEGORY:
            if (action.category === 'carts') {
                return {
                    ...state,
                    [action.id]: action.data
                }
            }
            return state
        case CLEAR_FROM_CATEGORY:
            if (action.category === 'carts') {
                let { [action.id]: discard, ...rest } = state
                return rest
            }
            return state
        default:
            return state;
    }
}

function orders(state = {}, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return {}
        case BULK_SET_CATEGORY:
            if (action.category === 'orders') {
                return action.bulk
            }
            return state
        case UPDATE_FROM_CATEGORY:
            if (action.category === 'orders') {
                return {
                    ...state,
                    [action.id]: action.data
                }
            }
            return state
        case CLEAR_FROM_CATEGORY:
            if (action.category === 'orders') {
                let { [action.id]: discard, ...rest } = state
                return rest
            }
            return state
        case SET_ORDER_WRITING: {
            return {
                ...state,
                [action.order_id]: {
                    ...state[action.order_id],
                    writing: action.write_status
                }
            }
        }
        case SET_ORDER_CHECKS: {
            return {
                ...state,
                [action.order_id]: {
                    ...state[action.order_id],
                    checks: action.checks,
                }
            }
        }
        default:
            return state;
    }
}

const initialSystem = {
    // selected_bill: '',
    default_listener_time: null,
    default_listener_time_timeout: null,
    table_order: []
}
function system(state = initialSystem, action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return {
                ...state,
                table_order: []
            }
        case SET_TABLE_ORDER:
            return {
                ...state,
                table_order: action.table_order
            }
        case SET_LISTENER_TIME:
            return {
                ...state,
                default_listener_time: action.time,
            }
        case SET_LISTENER_TIME_TIMEOUT:
            return {
                ...state,
                default_listener_time_timeout: action.timeout,
            }
        case CLEAR_LISTENER_TIME:
            return {
                ...state,
                default_listener_time: null,
                default_listener_time_timeout: null,
            }
        default:
            return state;
    }
}

function soldOutItems(state = [], action) {
    switch (action.type) {
        case CHANGE_RESTAURANT:
            return []
        case SET_SOLD_OUT_ITEMS:
            return action.item_ids
        default:
            return state
    }
}


const combinedReducer = combineReducers({
    app,
    alerts,
    restaurant,
    privateDocs,
    employees,
    tables,
    // meals,
    menus,
    sections,
    items,
    photos,
    photoAds,
    specifications,
    modifications,
    tracker,
    bills,
    minibills,
    carts,
    orders,
    system,
    user,
    soldOutItems,
});


export default combinedReducer