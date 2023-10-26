import { combineReducers } from 'redux';
import user from './reducerUser';
import bill from './reducerBill';
import app from './reducerApp';
import trackers from './reducerTrackers';
import restaurants from './reducerRestaurants';
import temp from './reducerTemp';
import alerts from './reducerAlerts';
import listeners from './reducerListeners';
import filters from './reducerFilters';
import firestore from './reducerFirestore';
import selections from './reducerSelections';
import receipt from './reducerReceipt';


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
    user,
    bill,
    receipt,
    app,
    temp,
    restaurants,
    trackers,
    alerts,
    filters,
    firestore,
    listeners,
    selections,
});

export default combinedReducer


