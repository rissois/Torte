import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import StyledButton from '../../utils/components/StyledButton';
import singularize from '../../utils/functions/singularize';
import Colors from '../../utils/constants/Colors';
import { useDispatch } from 'react-redux';
import Layout from '../../utils/constants/Layout';
import { doDeleteChild } from '../../redux/actions/actionsDelete';


const parents = {
  sections: ['menus'],
  panels: ['sections'],
  modifiers: ['items'],
  items: ['sections', 'items', 'modifiers'],
  options: ['items', 'modifiers']
}

export default function PortalDelete({ category, id, variant_id, isWithVariants }) {
  const dispatch = useDispatch()

  const [singularCategory] = useState(singularize(category))

  return <View style={{ marginTop: Layout.window.height * 0.1, width: '50%', alignSelf: 'center' }}>
    <StyledButton
      color={Colors.red}
      onPress={() => dispatch(doDeleteChild(category, id, variant_id,))}
      text={`Delete ${variant_id ? 'variant' : singularCategory}${isWithVariants ? ' and all variants' : ''}`}
    />
  </View>
}

const styles = StyleSheet.create({

});

