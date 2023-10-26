import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  PixelRatio,
  TouchableOpacity,
} from 'react-native';

import Colors from '../../utils/constants/Colors';
import { useDispatch, } from 'react-redux';

import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import { MaterialIcons } from '@expo/vector-icons';
import { DefaultText, LargeText, SuperLargeText } from '../../utils/components/NewStyledText';
import centsToDollar from '../../utils/functions/centsToDollar';
import Layout from '../../utils/constants/Layout';
import StyledButton from '../../utils/components/StyledButton';
// import { doTransactPaySplit } from '../redux-actions/actionsPaySplit';
import MainAlert from '../../utils/components/MainAlert';
import { useReceiptItemSplitDetails } from '../../utils/hooks/useReceiptItems';
import useReceiptSplit from '../hooks/useReceiptSplit';


export default function ReceiptItem({ setSavingIDs, receipt_item_id, clear, }) {
  const start = useCallback(() => setSavingIDs(prev => [...prev, receipt_item_id]), [])
  const complete = useCallback(() => setSavingIDs(prev => prev.filter(id => id !== receipt_item_id)))
  const split = useReceiptSplit(start, complete, complete)

  const [name, caption, subtotal, currentDenom, availableLength, myClaimedLength,] = useReceiptItemSplitDetails(receipt_item_id)

  useEffect(() => {
    if (!name) clear()
  }, [name])

  const [num, setNum] = useState(myClaimedLength || 1)
  const [denom, setDenom] = useState(currentDenom === 1 && availableLength ? 2 : currentDenom)
  const [isDenomLocked, setIsDenomLocked] = useState(myClaimedLength + availableLength < currentDenom)

  useEffect(() => {
    const isLocked = myClaimedLength + availableLength < currentDenom

    setIsDenomLocked(isLocked)
    setNum(prev => prev > availableLength + myClaimedLength ? availableLength + myClaimedLength : prev)
    setDenom(prev => isLocked ? currentDenom : prev)
  }, [availableLength, myClaimedLength, currentDenom])

  const headerLeft = useMemo(() => <TouchableOpacity onPress={clear}>
    <MaterialIcons name='close' color={Colors.white} size={30} />
  </TouchableOpacity>, [])

  return (
    <SafeView unsafeColor={Colors.black + 'F5'}>
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <Header left={headerLeft} />

        <View style={{ flexDirection: 'row', marginHorizontal: Layout.window.width * 0.1, }}>
          <View style={{ flex: 1 }}>
            <LargeText>{name}</LargeText>
            {!!caption && <DefaultText>{caption}</DefaultText>}
          </View>
          <LargeText>{centsToDollar(subtotal)}</LargeText>
        </View>

      </View>
      <View style={{ marginHorizontal: Layout.window.width * 0.2, marginVertical: 50 * PixelRatio.getFontScale() }}>
        <LargeText center>How many portions did you eat?</LargeText>
        <Quantity quantity={num} setQuantity={setNum} max={isDenomLocked ? myClaimedLength + availableLength : 20} />

        <View style={{ height: PixelRatio.getFontScale() * 30 }} />

        <LargeText center {...!!isDenomLocked && { red: true }}>{isDenomLocked ? 'This item is already split into portions' : 'How many ways are you splitting this item?'}</LargeText>
        <Quantity quantity={denom} setQuantity={setDenom} min={1} max={20} disable={isDenomLocked} />
      </View>

      <View style={{ flex: 1, marginHorizontal: Layout.window.width * 0.1 }}>
        <StyledButton disabled={num > denom} wide text={num > denom ? 'Invalid split' : !num ? myClaimedLength ? 'Unclaim item' : 'Do not claim' : num === denom ? 'Claim item' : `Claim ${num}/${denom} of item`} center onPress={() => {
          split(receipt_item_id, num, denom)
          clear()
        }} />
        {!!myClaimedLength && <StyledButton wide text='Unclaim item' center style={{ backgroundColor: Colors.red, marginTop: 20 }} onPress={() => {
          split(receipt_item_id, 0)
          clear()
        }} />}
      </View>

      <MainAlert />
    </SafeView>
  )
}


const Quantity = ({ quantity, setQuantity, min = 0, max, disable }) => {

  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: PixelRatio.getFontScale() * 8 }}>

    <TouchableOpacity disabled={!quantity || disable || quantity === min} onPress={() => setQuantity(prev => prev - 1)}>
      <MaterialIcons
        name="remove-circle-outline"
        color={!quantity || disable || quantity === min ? Colors.midgrey : Colors.white}
        size={30 * PixelRatio.getFontScale()}
      />
    </TouchableOpacity>

    <View style={{ minWidth: 60 * PixelRatio.getFontScale() }}>
      <SuperLargeText center>{quantity}</SuperLargeText>
    </View>

    <TouchableOpacity disabled={quantity >= max || disable} onPress={() => setQuantity(prev => prev + 1)}>
      <MaterialIcons
        name="add-circle-outline"
        color={quantity >= max || disable ? Colors.midgrey : Colors.white}
        size={30 * PixelRatio.getFontScale()}
      />
    </TouchableOpacity>
  </View>
}

const styles = StyleSheet.create({

});

