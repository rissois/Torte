import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import { useDispatch, } from 'react-redux';


import { MediumText, } from '../../utils/components/NewStyledText';
import { doTransactPaySplit } from '../redux-actions/actionsPaySplit';

export default function ClaimAll({ bill_item_ids, isClaimAllDisabled, isClaimAllAvailable }) {
  const dispatch = useDispatch()

  return (
    <TouchableOpacity disabled={isClaimAllDisabled} onPress={() => dispatch(doTransactPaySplit(bill_item_ids, isClaimAllAvailable ? Infinity : 0))}>
      <MediumText {...isClaimAllDisabled && { darkgrey: true }}>{isClaimAllAvailable ? 'Claim all' : 'Unclaim all'}</MediumText>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({

});

