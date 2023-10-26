// HOPEFULLY links are now consumed
// https://github.com/invertase/react-native-firebase/pull/4735

import { prefixes } from "../constants/linking";

export const checkIsTorteURL = (url) => {
    return prefixes.some(prefix => url.includes(prefix))
}

export const parseURL = (url) => {
    /*
        PARAMETERS
        https://torteapp.com/?r=[restaurant_id]&b=[bill_id]&t=[table_id]
        receipt if receipt
    */

    // https://stackoverflow.com/questions/44038180/react-native-parse-url-to-get-query-variable/44058434
    // Start with ? or &
    // First capture group starts after ? or & and ends before = (or #)
    // Second capture group starts after = and ends before & (or #)
    const paramRegex = /[?&]([^=#]+)=([^&#]*)/g
    let params = {}
    let match
    // Easier to just add the ? back in
    while (match = paramRegex.exec(url)) {
        params[match[1]] = match[2];
    }

    return { restaurant_id: params.r, table_id: params.t, bill_id: params.b, receipt_id: params.receipt, scan: !!(params.t || params.b || params.receipt), isRestaurantNavStateReset: true }
}

