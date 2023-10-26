import React from 'react';
import {
  Text,
} from 'react-native';

export default function Plurarize(props) {
  let {
    verbs = {},
    value,
    nouns = {},
    valueStyle = {},
    nounStyle = {},
    valueNounStyle = {}
  } = props

  let {
    s: singular_v,
    p: plural_v
  } = verbs

  let {
    s: singular_n,
    p: plural_n
  } = nouns

  let isOne = value === 1

  return <Text>{singular_v ? isOne ? singular_v : plural_v : ''} <Text style={valueNounStyle}><Text style={valueStyle}>{value}</Text> <Text style={nounStyle}>{isOne ? singular_n : plural_n}</Text></Text></Text>
}

