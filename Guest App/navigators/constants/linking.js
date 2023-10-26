import { Linking } from "react-native";
import { checkIsTorteURL, parseURL } from "../functions/handleLinks";

export const prefixes = [
  'http://localhost:19006',
  'https://tortepay.com',
  'https://torteapp.com',
  'https://links.tortepay.com',
  'https://##############.web.app',
]

const config = {
  initialRouteName: 'Home',
  screens: {
    Home: {
      path: '',
    },
  },
}

const getStateFromPath = (path, config) => {
  const params = parseURL(path)
  if (params.restaurant_id || params.receipt_id) return ({ routes: [{ name: 'Home' }, { name: 'Link', params }] })
  return ({ routes: [{ name: 'Home' }] })
}

/*
Below functions are only for a downloadoed app, and likely are not correct
// Custom function to get the URL which was used to open the app
const getInitialURL = async () => {
  // First, you may want to do the default deep link handling
  // Check if app was opened from a deep link
  const url = await Linking.getInitialURL();

  if (url) return url

  // FOR DYNAMIC LINKS: https://medium.com/tribalscale/working-with-react-navigation-v5-firebase-cloud-messaging-and-firebase-dynamic-links-abf79bbef34e
}

// Custom function to subscribe to incoming links
const subscribe = (listener) => {
  // First, you may want to do the default deep link handling
  const onReceiveURL = ({ url }) => listener(url);

  // Listen to incoming links from deep linking
  Linking.addEventListener('url', onReceiveURL);

  // FOR DYNAMIC LINKS: https://medium.com/tribalscale/working-with-react-navigation-v5-firebase-cloud-messaging-and-firebase-dynamic-links-abf79bbef34e

  return () => {
    // Clean up the event listeners
    Linking.removeEventListener('url', onReceiveURL);
  };
}
*/

const linking = {
  prefixes,
  config,
  getStateFromPath,
  // getInitialURL,
  // subscribe,
};

export default linking