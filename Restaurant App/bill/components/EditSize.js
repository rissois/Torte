import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { Pages } from '../../utils/components/Pages';
import { EditLineItemBox } from './EditLineItemBox';

const Size = ({ id, selected, setSelected }) => {
  return <EditLineItemBox
    isPurple={id?.name === selected?.name && id.price === selected?.price && id.code === selected?.code}
    text={id?.name}
    onPress={() => setSelected(id)}
  />
}

export const EditSize = ({ itemSizes = [], size = {}, setSize }) => {

  const child = useMemo(() => <Size setSelected={setSize} />)

  return <Pages ids={itemSizes} selected={size} child={child} category='sizes' />
}


const styles = StyleSheet.create({

});

