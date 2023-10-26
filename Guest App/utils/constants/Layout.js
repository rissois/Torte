import { Dimensions } from 'react-native';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

export default {
  window: {
    width,
    height,
  },
  marHor: width * 0.1,
  scrollViewPadBot: height * 0.3,
};
