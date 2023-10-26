// GUIDE: https://docs.expo.dev/bare/updating-your-app/
// DOCS: https://docs.expo.dev/versions/latest/sdk/updates/
// CONFIGURATION: https://docs.expo.dev/guides/configuring-ota-updates/

import * as Updates from 'expo-updates';
import { doAlertAdd } from "../../redux/actions/actionsAlerts";

export const handleUpdateOnAppActive = async (onAvailable, onFetched, dispatch) => {
    try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
            onAvailable()

            const wait = new Promise((resolve) => {
                setTimeout(resolve, 3000,);
            });

            const fail = new Promise((resolve) => {
                setTimeout(resolve, 10000, 'slow');
            });
            // 
            // Max 10 seconds to try to complete fetch
            const fetched = await Promise.race([
                fail,
                // Min 3 seconds to display fetch notice
                Promise.all([
                    wait,
                    Updates.fetchUpdateAsync()
                ])
            ])

            // const fetched = 'cant figure this out'
            if (fetched === 'slow') {
                dispatch(doAlertAdd('Unable to load latest update', 'Your connection may be too slow. If some features do not work, close and reopen the app.'))
            }
            else {
                onFetched()
                // await Updates.reloadAsync()
                setTimeout(Updates.reloadAsync, 1500)
            }
        }
    } catch (error) {
        // handle or log error
        console.log('handleUpdate error: ', error)
        dispatch(doAlertAdd('Unable to load latest update', 'If some features do not work, close and reopen the app. '))
    }
    finally {
        return null
    }
}