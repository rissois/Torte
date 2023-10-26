// import React, { useState } from 'react';
// import {
//   StyleSheet,
//   View,
//   ScrollView,
//   SafeAreaView,
//   Text,
//   TouchableOpacity,
//   TouchableWithoutFeedback
// } from 'react-native';
// import { } from 'react-native-gesture-handler';

// import Colors from '../constants/Colors';
// import Layout from '../constants/Layout';
// import writeClearWalkthrough from '../transactions/writeClearWalkthrough';

// const texts = {
//   // TableCode component
//   first_code: () => [
//     {
//       text: `Torte lets everyone at your table order together, and then pay together or separately.`,
//       size: 'bold'
//     },
//     {
//       text: `If no one at your table has started a bill with Torte yet, press "I am the first" to create a bill.`,
//       size: 'medium'
//     },
//     {
//       text: `Otherwise, ask someone at the table for your bill number and use that 4-digit number to join your group.`,
//       size: 'medium'
//     },
//   ],
//   // TableScreen
//   first_table: (name = 'your bill', ref_code = '####') => [
//     {
//       text: `Welcome to ${name}`,
//       size: 'bold'
//     },
//     {
//       text: `If anyone needs to join your bill, give them the bill #:`,
//       size: 'medium'
//     },
//     {
//       text: `${ref_code}`,
//       size: 'heavy'
//     },
//     {
//       text: `You can now order and pay from your phone!`,
//       size: 'medium'
//     },
//     {
//       text: `(we won't show you this screen again)`,
//       size: 'small'
//     },
//   ],
//   // MenuCart
//   cc: (first_card) => first_card ? [
//     {
//       text: `We need a valid credit card on file to place your order.`,
//       size: 'large'
//     },
//     {
//       text: `You will not be charged at this time.`,
//       size: 'large'
//     },
//     {
//       text: `You can always add more items after this order.`,
//       size: 'medium'
//     },
//     {
//       text: `Remember to pay before you leave! There is a gratuity and 3% fee for leaving without paying.`,
//       size: 'bold'
//     },
//   ] : [
//     {
//       text: `Your previous cards may have expired or been deleted.`,
//       size: 'medium'
//     },
//     {
//       text: `We need a valid credit card on file to place your order.`,
//       size: 'medium'
//     },
//   ],
//   // TableScreen
//   first_order: () => [
//     {
//       text: `Thanks for placing your first order!`,
//       size: 'large'
//     },
//     {
//       text: `You have not paid yet.`,
//       size: 'heavy'
//     },
//     {
//       text: `If you need to order more food, just press the ORDER button to add more!`,
//       size: 'medium'
//     },
//     {
//       text: `Press the PAY button to pay through the app before you leave.`,
//       size: 'medium'
//     },
//     {
//       text: `If all the items you ordered are not paid for, you will be charged their amount plus a gratuity and 3% fee.`,
//       size: 'medium'
//     },
//   ],
//   // PayStack
//   first_bill: () => [
//     {
//       text: `You can pay in four different ways!`,
//       size: 'bold'
//     },
//     {
//       text: `If you are paying for the entire bill, just press the red button on the next screen.`,
//       size: 'medium'
//     },
//     {
//       text: `With "Split By Item", you can even split each item!`,
//       size: 'medium'
//     },
//     {
//       text: `Please wait until the end of your meal to pay.`,
//       size: 'bold'
//     },
//   ],
//   // PayStack
//   first_split: (isEven) => [
//     {
//       text: `Now that you've started splitting, we've created a separate bill just for you.`,
//       size: 'bold'
//     },
//     ...isEven ? [{
//       text: `We'll take you there now.`,
//       size: 'medium'
//     }] : [{
//       text: `You can view and pay for this bill whenever you are ready`,
//       size: 'medium'
//     },],
//   ],
// }


// export default function Walkthrough({ field, argArray = [], allowDismiss = false, onOK = () => { }, onCancel }) {
//   const [contentHeight, setContentHeight] = useState(0)
//   const [scrollViewHeight, setScrollViewHeight] = useState(0)
//   const [deactivate, setDeactivate] = useState(false)

//   if (deactivate) {
//     return null
//   }

//   return <SafeAreaView
//     style={[
//       StyleSheet.absoluteFill,
//       {
//         elevation: 90,
//         backgroundColor: Colors.black + 'EF',
//         justifyContent: 'center',
//       },
//     ]}>
//     <TouchableWithoutFeedback disabled={!allowDismiss} onPress={() => {
//       setDeactivate(true)
//       writeClearWalkthrough(field)
//       onOK()
//     }}>
//       <ScrollView scrollEnabled={contentHeight > scrollViewHeight}
//         contentContainerStyle={{ padding: 20 }}
//         style={{ flexGrow: 0, margin: Layout.window.width * 0.1, backgroundColor: Colors.darkgrey }}
//         onLayout={({ nativeEvent }) => {
//           setScrollViewHeight(nativeEvent.layout.height)
//         }}>
//         <View onLayout={({ nativeEvent }) => {
//           setContentHeight(nativeEvent.layout.height)
//         }}>
//           {
//             contentHeight > scrollViewHeight && !allowDismiss && <Text style={styles.mediumText}>Please scroll to the bottom</Text>
//           }
//           {
//             !!texts[field] && texts[field](...argArray).map(({ text, size }) => <Text maxFontSizeMultiplier={1.7} style={[styles[size], styles.text]}>{text}</Text>)
//           }
//         </View>
//         <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
//           {!!onCancel && <TouchableOpacity onPress={onCancel}>
//             <Text maxFontSizeMultiplier={1.7} style={[styles.heavy, { color: Colors.white }]}>Cancel</Text>
//           </TouchableOpacity>}

//           <TouchableOpacity onPress={() => {
//             setDeactivate(true)
//             writeClearWalkthrough(field)
//             onOK()
//           }}>
//             <Text maxFontSizeMultiplier={1.7} style={[styles.heavy, { color: Colors.white }]}>OK</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </TouchableWithoutFeedback>
//   </SafeAreaView>

// }

// const styles = StyleSheet.create({
//   text: {
//     color: Colors.white,
//     paddingBottom: 20,
//   },
//   heavy: {
//     fontSize: 32,
//     textAlign: 'center',
//     fontWeight: 'bold',
//   },
//   bold: {
//     fontSize: 24,
//     textAlign: 'center',
//     fontWeight: 'bold',
//   },
//   large: {
//     fontSize: 24,
//     textAlign: 'center'
//   },
//   medium: {
//     fontSize: 20,
//     textAlign: 'center'
//   },
//   small: {
//     fontSize: 17,
//     textAlign: 'center'
//   },
// });
