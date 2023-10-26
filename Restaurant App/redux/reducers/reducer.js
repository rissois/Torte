import { combineReducers } from 'redux';
import alerts from './reducerAlerts';
import app from './reducerApp';
import bills from './reducerBills';
import billItems from './reducerBillItems';
import billOrders from './reducerBillOrders';
import deleteAlert from './reducerDeleteAlert';
import employees from './reducerEmployees';
import firestore from './reducerFirestore';
import items from './reducerItems';
import lineItems from './reducerLineItems4';
import listeners from './reducerListeners';
import menus from './reducerMenus';
import modifiers from './reducerModifiers';
import options from './reducerOptions';
import orderAlerts from './reducerOrderAlerts';
import panels from './reducerPanels';
import photos from './reducerPhotos';
import privates from './reducerPrivates';
import restaurant from './reducerRestaurant';
import sections from './reducerSections';
import success from './reducerSuccess';
import tables from './reducerTables';
import tableStatus from './reducerTableStatus';
import timers from './reducerTimers';
import trackers from './reducerTrackers';
import unpaid from './reducerUnpaid';
import charges from './reducerCharges';


//https://stackoverflow.com/questions/35622588/how-to-reset-the-state-of-a-redux-store
/*
const rootReducer = (state, action) => {
    if (action.type === 'root/LOG_OUT_USER') {
        return combinedReducer(undefined, action)
    }
    return combinedReducer(state, action)
}
*/

const combinedReducer = combineReducers({
    alerts,
    app,
    bills,
    billItems,
    billOrders,
    deleteAlert,
    employees,
    firestore,
    items,
    lineItems,
    listeners,
    menus,
    modifiers,
    options,
    orderAlerts,
    panels,
    photos,
    privates,
    restaurant,
    sections,
    success,
    tables,
    tableStatus,
    timers,
    trackers,
    unpaid,
    charges,
});

export default combinedReducer


