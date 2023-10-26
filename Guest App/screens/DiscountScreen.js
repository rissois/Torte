// import React, { useState, useEffect, } from 'react';

// import {
//   StyleSheet,
//   View,
//   StatusBar,
//   TouchableOpacity,
//   Text,
//   TouchableWithoutFeedback
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';


// import Colors from '../constants/Colors';
// import Layout from '../constants/Layout';

// import { useDispatch, useSelector } from 'react-redux';
// // import { seenDiscount, } from '../redux/actionsApp';
// const seenDiscount = () => { }
// import writeDeleteDiscountMessage from '../transactions/writeDeleteDiscountMessage';

// export default function DiscountScreen({ navigation }) {
//   const dispatch = useDispatch()

//   const { discounts = {}, } = useSelector(state => state.user)
//   const { seen_discounts = [], } = useSelector(state => state.app)

//   const [discount_id, setDiscountID] = useState('')
//   const [claimed, setClaimed] = useState(false)

//   useEffect(() => {
//     // Find a discount that has not been seen already
//     let unseen = Object.keys(discounts).find(id => !seen_discounts.includes(id))
//     setDiscountID(prev => {
//       if (unseen !== prev) {
//         setClaimed(false)
//       }
//       return unseen
//     })
//     if (!unseen) {
//       navigation.goBack()
//     }
//   }, [discounts, seen_discounts])

//   if (!discounts[discount_id]) {
//     return <View style={{ flex: 1 }} />
//   }

//   return (
//     <View style={{ flex: 1, }}>
//       <StatusBar barStyle="light-content" />
//       <TouchableWithoutFeedback onPress={() => {
//         // Decided to clear all in case of hurry, but maybe just the single is more logical?
//         writeDeleteDiscountMessage('all')
//         dispatch(seenDiscount(Object.keys(discounts)))
//       }}>
//         <SafeAreaView style={{ flex: 1, }}>
//           <View style={{ flex: 1, justifyContent: 'flex-end' }}>
//             <Text maxFontSizeMultiplier={1.6} style={{ color: Colors.white, fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 }}>{discounts[discount_id]?.restaurant ?? 'Torte'}</Text>
//           </View>

//           <View style={{ alignSelf: 'center', width: Layout.window.width * 0.6, backgroundColor: Colors.background, }}>
//             <View style={{ padding: 16 }}>
//               <Text maxFontSizeMultiplier={1.6} style={{ color: Colors.white, fontSize: 22, textAlign: 'center' }}>{discounts[discount_id]?.reason}</Text>
//               <View style={{ marginVertical: 20 }}>
//                 <Text maxFontSizeMultiplier={1.6} style={{ color: Colors.white, fontSize: 55, fontWeight: 'bold', textAlign: 'center' }}>{discounts[discount_id]?.amount}</Text>
//                 <Text maxFontSizeMultiplier={1.6} style={{ color: Colors.white, fontSize: 30, letterSpacing: 6, marginTop: -6, fontWeight: 'bold', textAlign: 'center' }}>off</Text>

//               </View>
//               <Text maxFontSizeMultiplier={1.6} style={{ color: Colors.white, fontSize: 17, letterSpacing: 2, textAlign: 'center' }}>{discounts[discount_id]?.subtext ?? ''}</Text>
//               <Text maxFontSizeMultiplier={2} style={{ color: Colors.white, fontSize: 17, letterSpacing: 2, textAlign: 'center' }}>{discounts[discount_id]?.disclaimer ?? ''}</Text>
//             </View>
//             <TouchableOpacity onPress={() => {
//               setClaimed(true)
//               writeDeleteDiscountMessage(discount_id)
//               dispatch(seenDiscount(discount_id))
//             }}>
//               <View style={{ paddingVertical: 12, borderTopWidth: 2, borderTopColor: Colors.modalBackground, backgroundColor: claimed ? Colors.darkgreen : Colors.purple }}>
//                 <Text maxFontSizeMultiplier={1.6} style={{ color: Colors.white, fontSize: 30, letterSpacing: 6, marginTop: -6, fontWeight: 'bold', textAlign: 'center' }}>{claimed ? 'Claimed' : 'Claim'}</Text>
//               </View>
//             </TouchableOpacity>
//           </View>

//           <View style={{ flex: 1 }} />


//         </SafeAreaView>
//       </TouchableWithoutFeedback>
//     </View >
//   )
// }




// const styles = StyleSheet.create({

// });
