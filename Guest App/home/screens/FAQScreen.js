import React from 'react';
import {
  StyleSheet,
  ScrollView,
  Linking,
  Text
} from 'react-native';
import Layout from '../../utils/constants/Layout';
import Colors from '../../utils/constants/Colors';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import { LargeText, MediumText, DefaultText } from '../../utils/components/NewStyledText';



export default function FAQScreen({ navigation, }) {

  // {'\u2022'} 
  return <SafeView>
    <Header back center>
      <LargeText center>FAQ</LargeText>
    </Header>

    <ScrollView style={{ flex: 1, }} contentContainerStyle={{ paddingBottom: Layout.scrollViewPadBot, paddingHorizontal: 30, }}>
      {/* <MediumText bold style={styles.sectionTitles}>Why was I charged after I already paid? And why is there a surcharge?</MediumText>
      <DefaultText style={styles.sectionText}>You should ALWAYS make sure the bill is fully paid before you leave. That includes reminding others at your table. Our policies on unpaid items are detailed in our Terms of Use, but to provide more context:</DefaultText>
      <View style={{ flexDirection: 'row' }}>
        <DefaultText>  {'\u2022'}    </DefaultText>
        <DefaultText style={styles.sectionText}>You are responsible for all items that you order. This is what is expected when a guest has completely forgotten to pay. It also helps avoid guests ordering and leaving others at their table to pay.</DefaultText>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <DefaultText>  {'\u2022'}    </DefaultText>
        <DefaultText style={styles.sectionText}>Each member of your table is equally responsible for items added by the server. Try to order through the app whenever possible, and make sure the correct person claims these server-added items. Please reach out to us if you find this system being abused.</DefaultText>
      </View>
      <DefaultText style={styles.sectionText}>The surcharge is standard industry practice, and reflects both U.S. tip culture and the added accounting work required.</DefaultText> */}

      <MediumText bold style={styles.sectionTitles}>What happens if there is a problem with my order or payment?</MediumText>
      <DefaultText style={styles.sectionText}>Please ask your server or contact the restaurant. They can make additional changes or void payments if required.</DefaultText>

      <MediumText bold style={styles.sectionTitles}>Why is there a 50¢ minimum on payments?</MediumText>
      <DefaultText style={styles.sectionText}>We use Stripe as our payment process, and this is a limitation set by Stripe.</DefaultText>

      <MediumText bold style={styles.sectionTitles}>Why was I charged for food I didn't order, or food that someone else at my table was supposed to split?</MediumText>
      <DefaultText style={styles.sectionText}>We have several policies in place that protect the restaurant from dine-and-dash. When you order through Torte, every member of your party is responsible for ensuring all items are fully paid BEFORE leaving the restaurant.
        Otherwise, Torte will charge the entire party to our best estimation. Please see our <Text style={{ color: Colors.green, fontWeight: 'bold' }} onPress={() => Linking.openURL('https://tortepay.com/eula')}>Terms and Conditions</Text> for a further breakdown. If our prediction was incorrect, please determine further reimbursement amongst yourselves as Torte cannot transfer money between individuals.</DefaultText>
    </ScrollView>
  </SafeView>

  // return (
  //   <View style={Layout.background}>
  //     <SafeAreaView style={{ flex: 1 }}>

  //       <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
  //         <TouchableOpacity style={{ flex: 1 }} onPress={() => { navigation.goBack() }}>
  //           <MaterialIcons
  //             name={'arrow-back'}
  //             size={30}
  //             color={Colors.white}
  //             style={{ paddingLeft: 8 }}
  //           />
  //         </TouchableOpacity>
  //         <BigBoldText maxFontSizeMultiplier={1.4} >FAQ</BigBoldText>
  //         <View style={{ flex: 1 }} />
  //       </View>
  //       <ScrollView style={{ flex: 1, paddingHorizontal: 16, }}>
  //         <CoreText maxFontSizeMultiplier={2} style={styles.sectionTitles}>Can I add food to a previous order?</CoreText>
  //         <DefaultText maxFontSizeMultiplier={2} style={styles.sectionText}>Yes, though there are some exceptions:</DefaultText>
  //         <View style={{ flexDirection: 'row', }}>
  //           <DefaultText maxFontSizeMultiplier={2} style={styles.sectionText}>  {'\u2022'}    </DefaultText>
  //           <DefaultText maxFontSizeMultiplier={2} style={styles.sectionText}>You can always order more food before anyone at your table starts the payment process.</DefaultText>
  //         </View>

  //         <View style={{ flexDirection: 'row', }}>
  //           <DefaultText maxFontSizeMultiplier={2} style={styles.sectionText}>  {'\u2022'}    </DefaultText>
  //           <DefaultText maxFontSizeMultiplier={2} style={styles.sectionText}>You cannot add food if you've already paid. Please scan or enter the code for your table and create a second bill instead.</DefaultText>
  //         </View>

  //         <View style={{ flexDirection: 'row', }}>
  //           <DefaultText maxFontSizeMultiplier={2} style={styles.sectionText}>  {'\u2022'}    </DefaultText>
  //           <DefaultText maxFontSizeMultiplier={2} style={styles.sectionText}>If someone at the table has offered to pay for the entire bill, or asked to split the bill evenly, no one at the table can order more food. Undo the selection to add more items</DefaultText>
  //         </View>

  //         <View style={{ flexDirection: 'row', }}>
  //           <DefaultText maxFontSizeMultiplier={2} style={styles.sectionText}>  {'\u2022'}    </DefaultText>
  //           <DefaultText maxFontSizeMultiplier={2} style={styles.sectionText}>If someone at the table has already paid for the entire bill, or an even portion of the bill, no one at the table can order more food. Please finish paying for this bill, then create scan or enter the code for your table to create a second bill.</DefaultText>
  //         </View>

  //         <DefaultText maxFontSizeMultiplier={2} style={styles.sectionText}>We are working on making our ordering system more flexible in the future.</DefaultText>


  //         <CoreText maxFontSizeMultiplier={2} style={styles.sectionTitles}>What happens if there is a problem with my order or payment?</CoreText>
  //         <DefaultText maxFontSizeMultiplier={2} style={styles.sectionText}>Please ask your server or contact the restaurant. They can make additional changes or void payments if required.</DefaultText>

  //         <CoreText maxFontSizeMultiplier={2} style={styles.sectionTitles}>Why is it when we split bills, the combined tax is sometimes higher than the bill's tax?</CoreText>
  //         <DefaultText maxFontSizeMultiplier={2} style={styles.sectionText}>It's a bit complicated, but it comes down to the government asking that tax be paid on the entire bill, but when we start to split items it introduces rounding errors. We therefore have to round up our tax estaimations to make sure our restaurants are compliant, but we've tried to minimize it to only a penny or two.</DefaultText>
  //       </ScrollView>
  //     </SafeAreaView>
  //   </View >
  // )
}



const styles = StyleSheet.create({
  sectionTitles: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionText: {
    marginBottom: 8,
    flexShrink: 1,

  }
});