import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Image,
} from 'react-native';
import { useFocusEffect, } from '@react-navigation/native';
import Colors from '../../utils/constants/Colors';
import { SerifText, } from '../../utils/components/NewStyledText';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import SafeView from '../../utils/components/SafeView';
import { useSelector } from 'react-redux';

export default function ConnectScreen({ navigation }) {
  const isCreatingAccount = useSelector(state => state.user.user?.id && !state.user.user?.date_joined)
  /*
    Cleans the cache directory of bill photos over a week old
  */
  useFocusEffect(useCallback(() => {
    const receiptsDir = async () => {
      try {

        let receipts = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + 'receipts/')

        if (receipts.exists) {
          console.log('ConnectScreen Receipts directory exists')
          let receiptArray = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory + 'receipts/')
          receiptArray.map(async path => {
            let { modificationTime } = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + 'receipts/' + path)
            if (new Date() - new Date(modificationTime * 1000) > (1000 * 60 * 60 * 24 * 7)) {
              // if (new Date() - new Date(modificationTime * 1000) > (1000 * 60)) { // 1 minute tester
              console.log('Receipt ' + path + ' is over a week old')
              FileSystem.deleteAsync(FileSystem.cacheDirectory + 'receipts/' + path)
            }
          })
          // Go through and delete
        }
        else {
          console.log('ConnectScreen Receipts directory does not exist')
          FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory + 'receipts/')
        }
      }
      catch (error) {
        console.log('ConnectScreen receiptDir error: ', error)
      }

    }

    receiptsDir()

  }, []))

  /*
  Cleans the directory of all restaurant over a day old (photos and menus)
  */

  useFocusEffect(useCallback(() => {
    const restaurantDir = async () => {
      try {
        let restaurants = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + 'restaurants/')

        if (restaurants.exists) {
          console.log('Restaurants directory exists')
          let restaurantsArray = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory + 'restaurants/')
          restaurantsArray.map(async path => {
            let { modificationTime } = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + 'restaurants/' + path)
            if (new Date() - new Date(modificationTime * 1000) > (1000 * 60 * 60 * 24)) { //24 hr clock
              // if (new Date() - new Date(modificationTime * 1000) > (1000 * 60)) { //1 min test clock
              console.log('Restaurant ' + path + ' is over a day old')
              FileSystem.deleteAsync(FileSystem.cacheDirectory + 'restaurants/' + path)
            }
          })
        }
        else {
          console.log('Restaurants directory does not exist')
          FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory + 'restaurants/')

        }
      }
      catch (error) {
        console.log('ConnectScreen restaurantDir error: ', error)
      }
    }

    restaurantDir()

  }, []))

  /*
    Could also consider removing from stack
  */

  return (
    <LinearGradient
      colors={[Colors.purple, Colors.green]}
      style={{ flex: 1 }}
      start={[0.1, 0.9]}
      end={[0.8, 0.1]}
    >
      <SafeView backgroundColor={null}>
        <View style={{ flex: 1 }} />

        <View style={styles.logo}>
          <Image style={{ height: 200, width: 200 }} source={require('../../assets/images/whiteLogo.png')} />
        </View>

        <View style={{ flex: 2, alignItems: 'center', justifyContent: 'flex-end' }}>
          <IndicatorOverlay opacity='00' text={isCreatingAccount ? 'Creating account\nPlease wait a moment' : 'Loading...'} />
          <SerifText center>Torte</SerifText>
        </View>
      </SafeView>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  logo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
