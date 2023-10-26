import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  TouchableOpacity,
  LayoutAnimation,
} from 'react-native';
import { FontAwesome, } from '@expo/vector-icons';
import { MediumText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import { stripeCardBrandToFontAwesome } from '../../utils/constants/stripeCardBrand';
import CardInput from '../../utils/components/CardInput';
import useCards from '../../utils/hooks/useCards';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const invalidColor = Colors.white + 'CA'



export default function PayCards({ card, setCard, isCardFieldVisible, setIsCardFieldVisible, overlayText, setOverlayText }) {
  const cards = useCards()
  const [isViewingAllCards, setIsViewingAllCards] = useState(false)

  useEffect(() => {
    setCard(cards[0] || null)
  }, [])

  const handleCardSelection = (c) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (c) setCard(c)
    setIsViewingAllCards(prev => !prev)
  }

  return (
    <View>
      <CardInput
        visible={isCardFieldVisible}
        clear={() => setIsCardFieldVisible(false)}
        callbackWithCard={card => setCard({ ...card, is_valid: true })}
        screen={'Pay'}
      />

      {
        !!card &&
        <TouchableOpacity disabled={!isViewingAllCards} onPress={() => handleCardSelection()}>
          <Card {...card} isSelected />
        </TouchableOpacity>
      }

      {
        isViewingAllCards && cards.map(c => {
          if (c.payment_method_id === card?.payment_method_id) return null
          return <TouchableOpacity disabled={!c.is_valid} key={c.payment_method_id} style={{ marginTop: 8 }} onPress={() => {
            handleCardSelection(c)
          }}>
            <Card {...c} />
          </TouchableOpacity>
        })
      }

      {cards.length > 1 && <TouchableOpacity onPress={() => handleCardSelection()} style={{ backgroundColor: Colors.lightgrey, borderRadius: 8, marginTop: 8 }}>
        <MediumText center bold style={{ paddingVertical: 10, color: Colors.background }}>{isViewingAllCards ? 'Hide cards' : `Select a ${card ? 'different ' : ' '}card`}</MediumText>
      </TouchableOpacity>}

      <TouchableOpacity onPress={() => setIsCardFieldVisible(true)} style={{ borderColor: Colors.lightgrey, borderRadius: 8, borderWidth: 1, marginTop: 8 }}>
        <MediumText center lightgrey bold style={{ paddingVertical: 10 }}>+ Add a new card</MediumText>
      </TouchableOpacity>

    </View>
  )
}




// Heavily duplicated with PayCards, need to abstract
const Card = ({ brand, last_four, name, isSelected, is_valid }) => {

  const backgroundColor = !is_valid ? Colors.red : isSelected ? Colors.white : Colors.background
  const color = !is_valid ? invalidColor : isSelected ? Colors.background : Colors.white
  return <View style={{
    flexDirection: 'row',
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: backgroundColor,
    ...(!isSelected && is_valid) && {
      borderColor: Colors.white,
      borderWidth: StyleSheet.hairlineWidth
    }
  }}>
    <FontAwesome
      name={stripeCardBrandToFontAwesome(brand)}
      color={color}
      size={56}
    />
    <View style={{ marginLeft: 8, paddingVertical: 6 }}>
      {!!(name || !is_valid) && <MediumText bold style={{ color }}>{is_valid ? name : 'EXPIRED'}</MediumText>}
      <MediumText style={{ color }}><MediumText bold style={{ color }}> {'\u2022'}{'\u2022'}{'\u2022'}{'\u2022'} {'\u2022'}{'\u2022'}{'\u2022'}{'\u2022'} {'\u2022'}{'\u2022'}{'\u2022'}{'\u2022'}</MediumText> {last_four}</MediumText>
    </View>
  </View>
}




const styles = StyleSheet.create({

});