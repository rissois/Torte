import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React, { useState, useEffect, useRef, useMemo, } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,

} from 'react-native';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { selectReceiptUserNames } from '../../redux/selectors/selectorsReceipt';
import { DefaultText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import { useMyID } from '../../utils/hooks/useUser.web';
import ReceiptHeader from '../components/ReceiptHeader';

export default function UsersScreen({ navigation, route }) {
  const tabBarHeight = useBottomTabBarHeight()
  const myID = useMyID()

  // Dummies require created_by
  const userNames = useSelector(selectReceiptUserNames, shallowEqual)

  const userIDs = useMemo(() => Object.keys(userNames).sort((a, b) => {
    if (a === myID) return -1
    if (b === myID) return 1
    return a - b
  }), [userNames])

  // More obvious QR code?
  return (
    <SafeView>
      <ReceiptHeader qr />

      <DefaultText center style={{ margin: 40 }}>We hope to add more features soon, including the ability to initiate Venmo requests and split for another person!</DefaultText>

      <FlatList
        style={{ flex: 1, marginBottom: tabBarHeight }}
        contentContainerStyle={{ paddingBottom: Layout.scrollViewPadBot, marginHorizontal: Layout.window.width * 0.1 }}
        data={userIDs}
        keyExtractor={userID => userID}
        renderItem={({ item: userID, index }) => <View style={[styles.user, !index && styles.firstUser]}>
          <LargeText>{userNames[userID]}</LargeText>
        </View>}
      />
    </SafeView>
  )
}


const styles = StyleSheet.create({
  user: {
    borderColor: Colors.lightgrey,
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  firstUser: {
    borderTopWidth: StyleSheet.hairlineWidth,
  }
});