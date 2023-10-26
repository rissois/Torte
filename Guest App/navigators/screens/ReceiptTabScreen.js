import React, { useCallback, useEffect } from 'react';
import {

} from 'react-native';

import EditScreen from '../../receipt/screens/EditScreen.web';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import UsersScreen from '../../receipt/screens/UsersScreen.web';
import DivideScreen from '../../receipt/screens/DivideScreen.web';
import ReceiptsScreen from '../../receipt/screens/ReceiptsScreen.web';
import Colors from '../../utils/constants/Colors';
import { AntDesign, Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsReceiptEditor, selectReceiptIsApproved } from '../../redux/selectors/selectorsReceipt';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';

const ReceiptTab = createBottomTabNavigator();

export default function ReceiptTabScreen({ navigation, route }) {
  const isApproved = useSelector(selectReceiptIsApproved)
  const isEditor = useSelector(selectIsReceiptEditor)
  const isEditing = useSelector(state => state.receipt.isEditing)
  const dispatch = useDispatch()

  const tabPress = useCallback(e => {
    const screen = e.target.includes('Edit') ? 'Edit' : e.target.includes('User') ? 'Users' : e.target.includes('Divide') ? 'Divide' : 'Receipts'

    if (isEditing) {
      if (screen === 'Edit') return
      dispatch(doAlertAdd('Discard changes?', 'You have unsaved changes. Do you want to leave without saving?', [
        {
          text: 'Yes',
          onPress: () => navigation.navigate(screen)
        },
        {
          text: 'No, go back'
        }
      ]))
      return e.preventDefault()
    }

    if (isApproved) return
    if (screen === 'Users') dispatch(doAlertAdd('Confirm the receipt before adding users'))
    if (screen === 'Divide') dispatch(doAlertAdd('Confirm the receipt before you split'))
    if (screen === 'Receipts') dispatch(doAlertAdd('Confirm the receipt before looking at summaries'))
    return e.preventDefault()
  }, [isApproved, isEditing])

  return (
    <ReceiptTab.Navigator
      screenOptions={() => ({
        headerShown: false,
        gestureEnabled: false,
        tabBarActiveTintColor: Colors.white,
        tabBarActiveBackgroundColor: Colors.darkgreen,
        tabBarInactiveTintColor: isApproved ? Colors.white : Colors.white + '2D',
        tabBarInactiveBackgroundColor: Colors.darkgrey,
        tabBarStyle: { borderTopColor: Colors.midgrey }
        // tabBarLabelPosition:'below-icon',
      })}
      screenListeners={{ tabPress }}
    >
      {isEditor && <ReceiptTab.Screen name="Edit" component={EditScreen} unmountOnBlur={true} options={{
        tabBarIcon: ({ color, size }) => (
          <AntDesign name="edit" color={color} size={size} />
        ),
        unmountOnBlur: true
        // tabBarItemStyle: { borderRightColor: Colors.midgrey, borderRightWidth: 1 }
      }} />}
      <ReceiptTab.Group>
        <ReceiptTab.Screen name="Divide" component={DivideScreen} options={{
          tabBarLabel: 'Split',
          tabBarIcon: ({ color, size }) => (
            <Feather name="pie-chart" color={color} size={size} />
          ),
        }} />
        <ReceiptTab.Screen name="Receipts" component={ReceiptsScreen} options={{
          tabBarLabel: 'Summaries',
          tabBarIcon: ({ color, size }) => (
            <Feather name="list" color={color} size={size} />
          ),
        }} />
        <ReceiptTab.Screen name="Users" component={UsersScreen} options={{
          tabBarLabel: 'Party',
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" color={color} size={size} />
          ),
        }}
        // listeners={{tabPress: }}
        />
      </ReceiptTab.Group>
    </ReceiptTab.Navigator>
  )
}

