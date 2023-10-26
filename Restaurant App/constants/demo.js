import firebase from '../config/Firebase';

export const demo_restaurant_ids = ['K00IXKl5xiNmsTBYro0dRSK8gtA3']

export const isDemo = () => demo_restaurant_ids.includes(firebase?.auth()?.currentUser?.uid)

export const demoDate = new Date('2020/12/14 17:42:46') //Monday at 5:42PM