import React, { } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { FontAwesome, } from '@expo/vector-icons';

import { DefaultText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import Layout from '../../utils/constants/Layout';
import { stripeCardBrandToFontAwesome } from '../../utils/constants/stripeCardBrand';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';

const INVALID_CARD_COLOR = Colors.white + 'CA'


// Heavily duplicated with PayCards, need to abstract
export default function Card({ id, payment_method_id, brand, last_four, name, exp_month, exp_year, isChanging, is_valid, is_favorite, makeFavorite, deleteCard, setCardToName }) {

  const backgroundColor = is_valid ? Colors.background : Colors.red
  const color = is_valid ? Colors.white : INVALID_CARD_COLOR
  const borderColor = is_valid ? Colors.white : Colors.red

  return <View style={styles.cardSeparator}>
    <View style={[styles.card, { backgroundColor, borderColor }]}>
      <FontAwesome
        name={stripeCardBrandToFontAwesome(brand)}
        color={color}
        size={56}
        style={{ alignSelf: 'center', }}
      />
      <View style={styles.cardDetails}>
        <TouchableOpacity onPress={() => setCardToName({ id, brand, last_four, name })}>
          <MediumText bold style={{ color }}>{name || '(add a name)'}</MediumText>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', }}>
          <MediumText style={{ color, flex: 1 }}><MediumText bold style={{ color }}> {'\u2022'}{'\u2022'}{'\u2022'}{'\u2022'} {'\u2022'}{'\u2022'}{'\u2022'}{'\u2022'} {'\u2022'}{'\u2022'}{'\u2022'}{'\u2022'}</MediumText> {last_four}</MediumText>
        </View>
      </View>

      <View style={styles.cardExpiration}>
        <DefaultText style={{ color: is_valid ? Colors.lightgrey : color, }}>{is_valid ? `${exp_month.toString().padStart(2, '0')}/${exp_year.toString().slice(-2)}` : 'EXP'}</DefaultText>
      </View>
    </View>

    {
      is_favorite
        ? <DefaultText center lightgrey style={{ marginHorizontal: Layout.marHor }}>You must set a new card as the favorite to delete this card</DefaultText>
        : <View style={styles.changeCard}>
          <TouchableOpacity disabled={!is_valid} style={{ opacity: is_valid ? 1 : 0 }} onPress={() => { makeFavorite(id) }}>
            <DefaultText>Set as favorite</DefaultText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteCard(id, name || brand + ' ' + last_four, payment_method_id)}>
            <DefaultText red>Delete card</DefaultText>
          </TouchableOpacity>
        </View>
    }

    {!!isChanging && <IndicatorOverlay />}
  </View >
}


const styles = StyleSheet.create({
  cardSeparator: {
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth
  },
  cardDetails: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 6,
  },
  cardExpiration: {
    marginLeft: 8,
    paddingVertical: 6,
  },
  changeCard: {
    flexDirection: 'row',
    marginTop: 6,
    justifyContent: 'space-evenly',
  },
});