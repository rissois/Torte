import { Dimensions, PixelRatio } from 'react-native';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

export default {
  window: {
    width,
    height,
  },
  marHor: width * 0.05,
  scrollViewPadBot: height * 0.3,
  spacer: {
    small: 14 + PixelRatio.getFontScale() * 4,
    medium: 30 + PixelRatio.getFontScale() * 4,
    large: 60 + PixelRatio.getFontScale() * 4,
  },
};
