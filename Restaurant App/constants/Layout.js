import { Dimensions, PixelRatio } from 'react-native';
import Constants from 'expo-constants';
import Colors from '../constants/Colors';
import { Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export default {
  window: {
    width,
    height,
  },
  spacer: {
    small: 14 + PixelRatio.getFontScale() * 4,
    medium: 30 + PixelRatio.getFontScale() * 4,
    large: 60 + PixelRatio.getFontScale() * 4,
  },

  cursor: {
    onDuration: 100,
    offDuration: 800,
    offDelay: 100,
    onDelay: 270,
  },

  dollarKeyboard: {
    height: 230,
    duration: 300,
  },

  fontFamily: {
    default: 'System',
    torte: Platform.OS === 'ios' ? 'Hiragino Mincho ProN' : 'serif',
    date: 'AvenirNextCondensed-Bold',
  },

  fontWeight: {
    thin: '100',
    ultraLight: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
    black: '900',
  },

  circle: {
    small: 44,
    spacing: 20,
  },

  alert: {
    alertContainer: {
      backgroundColor: Colors.white,
      width: width * 0.8,
      borderRadius: 15,
      alignSelf: 'center',
    },
    alertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
    },
    alertIcon: {
      width: 60,
      alignItems: 'center',
    },
    alertItem: {
      padding: 16,
    },
    alertTextContainer: {
      flex: 1,
      alignItems: 'center',
      flexWrap: 'wrap',

    },
    alertTextHeader: {
      fontSize: 22,
      fontWeight: '700',
      color: Colors.red,
      marginBottom: 8,
    },
    alertTextBody: {
      fontSize: 14,
      fontWeight: '400',
      textAlign: 'center',
    },
    alertItemText: {
      fontSize: 14,
      fontWeight: '500',
    },
  },

  userCircle: {
    height: 44,
    width: 44,
    backgroundColor: Colors.darkgrey,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCircleText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '100',
  },

  modal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.modalBackground,
  },

  headerDefault: {
    headerStyle: {
      backgroundColor: Colors.black,
      borderBottomColor: Colors.darkgrey,
    },
    headerTintColor: Colors.white,
    headerTitleStyle: {
      fontWeight: '600',
      fontSize: 24,
    },
    gesturesEnabled: false,
  },

  headerStyle: {
    backgroundColor: Colors.black,
    borderBottomColor: Colors.darkgrey,
  },
  headerBackground: Colors.black,
  headerTint: Colors.white,
  headerTitle: {
    fontWeight: '600',
    fontSize: 24,
  },

  header: {
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  background: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  safeArea: {
    flex: 1,
    backgroundColor: Colors.background
  },

  marginContainer: {
    marginHorizontal: 16,
  },


  brandName: {
    color: Colors.white,
    fontSize: 36,
    fontFamily: 'Hiragino Mincho ProN',
    marginTop: 4, // Torte lacks descenders, marginTop lowers text for vertical alignment
  },
  brandTag: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Hiragino Mincho ProN',
  },





  /*
  statusBar: Constants.statusBarHeight,
  shadow: {
    shadowColor: Colors.darkContrast2,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  */
};
