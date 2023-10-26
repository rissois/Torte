// HOPEFULLY links are now consumed
// https://github.com/invertase/react-native-firebase/pull/4735

import AsyncStorage from "@react-native-async-storage/async-storage"
import dynamicLinks from '@react-native-firebase/dynamic-links';


// https://links.tortepay.com/?link=https%3A%2F%2Ftortepay.com?r=[r_id]?t=[t_id]&apn=com.torte.pay&isi=1491684037&ibi=com.Torte.TortePay&efr=1
export const launchURL = async (url, dispatch) => {
    /*
        { r: "[restaurant_id]", t: "[table_code]", b: "[bill_id]" }
    */
    const params = parseUrl(url)
    if (!params) return null // ERROR

    const {
        r: restaurant_id,
        b: bill_id,
        t: table_code
    } = params

    if (!restaurant_id || (!table_code && !bill_id)) return null // ERROR

    /*
    
    */
}

export const checkIsTorteURL = (url) => {
    return url.includes('https://links.tortepay.com/?link=https%3A%2F%2Ftortepay.com')
}

export const parseURL = (url) => {
    /*
        PARAMETERS
        https://links.tortepay.com/?link=https%3A%2F%2Ftortepay.com?r=[restaurant_id]&t=[table_code]&b=[bill_id]&apn=com.torte.pay&isi=1491684037&ibi=com.Torte.TortePay&efr=1

        RETURNS
        { r: "[restaurant_id]", t: "[table_code]", b: "[bill_id]" }
    */
    const queryStringRegex = /tortepay.com[?](.*)&apn/

    const queryString = queryStringRegex.exec(url)
    if (!queryString) return null

    // https://stackoverflow.com/questions/44038180/react-native-parse-url-to-get-query-variable/44058434
    // Start with ? or &
    // First capture group starts after ? or & and ends before = (or #)
    // Second capture group starts after = and ends  before & (or #)
    const paramRegex = /[?&]([^=#]+)=([^&#]*)/g
    let params = {}
    let match
    // Easier to just add the ? back in
    while (match = paramRegex.exec('?' + queryString[1])) {
        params[match[1]] = match[2];
    }

    return params
}

export const retrieveInitialURL = async () => {
    console.log('RETRIVE INITIAL URL')
    const recentLink = await dynamicLinks().getInitialLink()
    console.log('RETRIVE INITIAL URL recentLink.url: ', recentLink?.url)
    if (recentLink?.url) return recentLink.url

    const storedURL = await AsyncStorage.getItem('initial_url')
    console.log('RETRIVE INITIAL URL storedURL: ', storedURL)
    if (storedURL) await AsyncStorage.removeItem('initial_url')
    return storedURL
}

