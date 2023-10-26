import React, { useState, useCallback, useMemo, } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { useDispatch, } from 'react-redux';

import firestore from '@react-native-firebase/firestore'
import functions from '@react-native-firebase/functions'
import { DefaultText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import Layout from '../../utils/constants/Layout';
import InputForm from '../../utils/components/InputForm';
import CardInput from '../../utils/components/CardInput';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { doAppStripeTestModeSet } from '../../redux/actions/actionsApp';
import useModalCloser from '../../utils/hooks/useModalCloser';
import useCards from '../../utils/hooks/useCards';
import Card from '../components/Card';
import { useIsMyAccountAdmin, useMyRef } from '../../utils/hooks/useUser';
import { useIsStripeTestMode } from '../../utils/hooks/useApp';

export default function CardsScreen({ navigation, route }) {
  useModalCloser('Cards', () => setIsAddRequested(false))

  const dispatch = useDispatch()
  const myRef = useMyRef()
  const isAdmin = useIsMyAccountAdmin()
  const isStripeTestMode = useIsStripeTestMode()

  const [favorite, ...other] = useCards()

  const [cardToName, setCardToName] = useState(null)
  const [newName, setNewName] = useState('')

  const [changingCards, setChangingCards] = useState([])
  const [isAddRequested, setIsAddRequested] = useState(false)

  const headerRight = useMemo(() => (
    (isAdmin || __DEV__) && <TouchableOpacity onPress={() => dispatch(doAppStripeTestModeSet(!isStripeTestMode))}><DefaultText>{isStripeTestMode ? 'live' : 'test'}</DefaultText></TouchableOpacity>
  ), [isStripeTestMode])

  const makeFavorite = useCallback(async (card_id) => {
    try {
      setChangingCards(prev => [...prev, card_id])
      const cardsRef = myRef.collection('Cards')

      const favorite = (await cardsRef.where('is_favorite', '==', true).where('is_test', '==', isStripeTestMode).get()).docs[0]
      if (favorite?.data()?.id === card_id) return null

      const batch = firestore().batch()
      if (favorite.exists) batch.update(favorite.ref, { is_favorite: false })
      batch.update(cardsRef.doc(card_id), { is_favorite: true })
      batch.commit()
    }
    catch (error) {
      console.log('CardsScreen makeFavorite error: ', error)
      dispatch(doAlertAdd('Unable to make card favorite', 'Please try again and let us know if the error persists.'))
    }
    finally {
      setChangingCards(prev => prev.filter(id => id !== card_id))
    }
  }, [isStripeTestMode])

  const nameCard = useCallback(async (card_id, name) => {
    try {
      setCardToName(false)
      setChangingCards(prev => [...prev, card_id])
      await myRef.collection('Cards').doc(card_id).update({ name })
    }
    catch (error) {
      console.log('CardsScreen deleteCard error: ', error)
      dispatch(doAlertAdd('Unable to change card name', 'Please try again and let us know if the error persists.'))
    }
    finally {
      setChangingCards(prev => prev.filter(id => id !== card_id))
    }
  }, [])

  const deleteCard = useCallback(async (card_id, name, payment_method_id) => {
    dispatch(doAlertAdd(`Delete ${name}?`, 'This action cannot be undone.', [
      {
        text: 'Yes',
        onPress: async () => {
          // Is it worth checking card exists, is not favorite, is not already deleted?
          try {
            setChangingCards(prev => [...prev, card_id])

            const { data: { success, error } } = await functions().httpsCallable('stripePaymentMethods-deletePaymentMethod')({
              isTest: isStripeTestMode,
              payment_method_id
            })

            if (error) throw error
            await myRef.collection('Cards').doc(card_id).update({ is_deleted: true })
          }
          catch (error) {
            console.log('CardsScreen deleteCard error: ', error)
            dispatch(doAlertAdd('Unable to delete card', 'Please try again and let us know if the error persists.'))
          }
          finally {
            setChangingCards(prev => prev.filter(id => id !== card_id))
          }
        }
      },
      {
        text: 'No',
      }
    ], undefined, undefined, true
    ))
  }, [])


  return (
    <SafeView noBottom>
      <CardInput
        visible={isAddRequested}
        clear={() => setIsAddRequested(false)}
      />

      <Header back right={headerRight}>
        <LargeText center>{(isAdmin || __DEV__) ? isStripeTestMode ? 'TEST ' : 'LIVE ' : ''}Cards</LargeText>
      </Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <GroupHeader text='Favorite card:' />
        {
          !!favorite
            ? <Card {...favorite} setCardToName={setCardToName} isChanging={changingCards.includes(favorite.id)} />
            : <MediumText style={{ marginBottom: 20 }}>No card</MediumText>
        }


        {!!other?.length && <View>
          <GroupHeader text='Other cards:' />
          {
            other.map(card => <Card
              key={card.id}
              {...card}
              isChanging={changingCards.includes(card.id)}
              makeFavorite={makeFavorite}
              deleteCard={deleteCard}
              setCardToName={setCardToName} />)
          }
        </View>}

        <TouchableOpacity style={{ marginTop: 30 }} onPress={() => setIsAddRequested(true)}>
          <View style={styles.addCardButton}>
            <LargeText center>+   Add a new card   +</LargeText>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {!!cardToName && <InputForm
        close={() => setCardToName(null)}
        success={() => nameCard(cardToName.id, newName)}
        inputs={[
          {
            prompt: `Enter a new name for ${cardToName.brand} #${cardToName.last_four}:`,
            value: newName,
            setText: setNewName,
            placeholder: cardToName.name ? `Clear ${cardToName.name}` : 'Enter a name',
            autoFocus: true,
          }
        ]}
      />}
    </SafeView>
  )
}

const GroupHeader = ({ text }) => (
  <View style={styles.groupHeader} >
    <LargeText bold>{text}</LargeText>
  </View>
)

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingHorizontal: Layout.marHor,
  },
  scrollViewContent: {
    paddingTop: 10,
    paddingBottom: Layout.scrollViewPadBot,
  },
  groupHeader: {
    borderBottomColor: Colors.white,
    borderBottomWidth: 1,
    paddingBottom: 4,
    marginBottom: 12
  },
  addCardButton: {
    alignSelf: 'center',
    borderRadius: 8,
    borderColor: Colors.white,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
});