// import React, { useState, useEffect, } from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   StatusBar,
//   SafeAreaView,
//   TouchableOpacity,
//   ScrollView,
//   TouchableWithoutFeedback
// } from 'react-native';



// import Colors from '../constants/Colors';
// import Layout from '../constants/Layout';
// import { useSelector, } from 'react-redux';
// import RenderOverlay from './RenderOverlay';
// import Plurarize from './Plurarize';
// import centsToDollar from '../functions/centsToDollar';
// import writeToggleDiscount from '../transactions/writeToggleDiscount';


// const discountWidth = Layout.window.width * 0.6

// export default function Discounts(props) {
//   const { discounts, bill: { user_summaries = {} } } = useSelector(state => state.newRestaurant)
//   const { user_id, } = useSelector(state => state.user)
//   let { [user_id]: userSummary = {} } = user_summaries



//   let { closeModal, availableDiscounts = [], billRef, discountAmount = 0, final = 0 } = props

//   return (
//     <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.97)' }}>
//       <StatusBar barStyle="light-content" />


//       <SafeAreaView style={styles.safeArea}>

//         <TouchableWithoutFeedback onPress={() => { closeModal() }}>
//           <View style={{ flex: 3, width: '100%', justifyContent: 'center', paddingHorizontal: 30 }}>

//             {!!final && discountAmount >= final && <Text maxFontSizeMultiplier={1.4} style={{ color: Colors.red, fontSize: 24, fontWeight: '800', textAlign: 'center' }}>You've just discounted your way to a free meal!</Text>}
//           </View>
//         </TouchableWithoutFeedback>
//         <View style={{ justifyContent: 'center' }}>
//           <ScrollView
//             contentContainerStyle={{ paddingHorizontal: Layout.window.width * 0.5 - (discountWidth * 0.5), marginVertical: 10 }}
//             style={{ flexGrow: 0, }}
//             // indicatorStyle={'white'}
//             horizontal
//           >

//             {
//               Object.keys(discounts).sort().map((discount_id) => {
//                 // Can consider sorting by value, etc. instead of keys
//                 let index = availableDiscounts.indexOf(discount_id)
//                 if (~index) {
//                   return <View key={discount_id} style={{ ...index && { marginLeft: 24 } }}><Discount key={discount_id} billRef={billRef} discount={discounts[discount_id]} discount_id={discount_id} selectedDiscounts={userSummary.discounts} alreadyFree={discountAmount >= final} /></View>
//                 }
//               })
//             }

//           </ScrollView>
//         </View>

//         <TouchableWithoutFeedback onPress={() => { closeModal() }}>
//           <View style={{ flex: 5, justifyContent: 'center', alignItems: 'center' }}>
//             <Text maxFontSizeMultiplier={1.4} style={{ color: Colors.white, fontSize: 24, fontWeight: '800', textAlign: 'center' }}><Plurarize value={Object.keys(userSummary.discounts ?? {}).length} nouns={{ s: 'discount', p: 'discounts' }} /> applied</Text>
//             <Text maxFontSizeMultiplier={1.4} style={{ color: Colors.white, fontSize: 24, fontWeight: '800', textAlign: 'center' }}>{centsToDollar(discountAmount)} off {centsToDollar(final ?? 0)}</Text>
//             <TouchableOpacity onPress={() => { closeModal() }}>
//               <View style={[styles.payButton, { marginVertical: 20 }]}>
//                 <Text maxFontSizeMultiplier={1.4} style={{ color: Colors.white, fontSize: 24, fontWeight: '800', textAlign: 'center' }}>{Object.keys(userSummary.discounts ?? {}).length ? 'Apply discounts' : 'Return to payment'}</Text>
//               </View>
//             </TouchableOpacity>
//           </View>
//         </TouchableWithoutFeedback>




//         {!availableDiscounts.length && <RenderOverlay text='Checking for discounts...' opacity={0.9} />}

//       </SafeAreaView>

//     </View >
//   )
// }

// const Discount = ({ discount = {}, discount_id, billRef, selectedDiscounts = {}, alreadyFree = false }) => {

//   let { maxValue, percent } = discount
//   let value = percent ? percent + '%' : centsToDollar(maxValue)
//   let warning = null // Should warn for expiration, combinable
//   let selected = !!selectedDiscounts[discount_id]
//   const [processing, setProcessing] = useState(false)
//   useEffect(() => {
//     setProcessing(false)
//   }, [selected])


//   /*
//   Automatic should just save 
//   */
//   /*
//     Things to warn about: 
//       EXPIRES
//       MAX AMOUNT
//   */
//   return <View style={{ width: discountWidth, backgroundColor: Colors.background, }}>
//     <View style={{ padding: 16 }}>
//       <Text maxFontSizeMultiplier={1.4} style={{ color: Colors.white, fontSize: 22, textAlign: 'center' }}>{discount.reason}</Text>
//       <View style={{ marginVertical: 20 }}>
//         <Text maxFontSizeMultiplier={1.4} style={{ color: Colors.white, fontSize: 55, fontWeight: 'bold', textAlign: 'center' }}>{value}</Text>
//         <Text maxFontSizeMultiplier={1.4} style={{ color: Colors.white, fontSize: 30, letterSpacing: 6, marginTop: -6, fontWeight: 'bold', textAlign: 'center' }}>off</Text>
//         {!!(percent && maxValue) && <Text maxFontSizeMultiplier={1.4} style={{ color: Colors.white, fontSize: 17, letterSpacing: 2, textAlign: 'center' }}>up to {maxValue % 100 ? centsToDollar(maxValue) : '$' + (maxValue / 100)}</Text>}
//       </View>
//       {!!warning && <Text maxFontSizeMultiplier={1.4} style={{ color: Colors.red, fontSize: 17, textAlign: 'center' }}>{warning}</Text>}
//     </View>
//     <TouchableOpacity disabled={alreadyFree && !selected} onPress={() => {
//       writeToggleDiscount(billRef, discount_id, !selected, maxValue, percent)
//     }}>
//       <View style={{ paddingVertical: 12, borderTopWidth: 2, borderTopColor: Colors.modalBackground, backgroundColor: processing ? Colors.darkgrey : selected ? Colors.darkgreen : null }}>
//         <Text maxFontSizeMultiplier={1.4} style={{ color: Colors.white, fontSize: 30, letterSpacing: 6, marginTop: -6, fontWeight: 'bold', textAlign: 'center' }}>{processing ? 'Changing...' : selected ? 'Selected' : 'Select'}</Text>
//       </View>
//     </TouchableOpacity>
//   </View>
// }



// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     alignItems: 'center'
//   },
//   button: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: Layout.window.width * 0.5,
//     borderRadius: 5,
//     height: Layout.window.width * 0.1,
//     marginBottom: 16
//   },
//   form: {
//     width: Layout.window.width * 0.9,
//     color: Colors.white,
//     borderColor: Colors.white,
//     borderWidth: 1,
//     borderRadius: 5,
//     backgroundColor: Colors.darkgrey,
//     overflow: 'hidden',
//   },
//   actionContainer: {
//     width: Layout.window.width * 0.8,
//     paddingVertical: 16,
//     marginBottom: 8,
//     alignSelf: 'center',
//   },
//   actionRow: {
//     flexDirection: 'row',
//   },
//   actionItem: {
//     padding: 16,
//     paddingTop: 8,
//   },
//   payButton: {
//     backgroundColor: Colors.purple,
//     borderRadius: 30,
//     paddingVertical: 12,
//     width: Layout.window.width * 0.8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16
//   },
// });