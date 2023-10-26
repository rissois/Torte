import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeHavingLoggedIn = async () => {
    return AsyncStorage.setItem('logged_in_once', 'true')
}