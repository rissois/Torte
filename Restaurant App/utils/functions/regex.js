export const regexIsNumber = text => /^-?[0-9]*$/.test(text)

export const regexIsDecimal = text => /^-?([0-9]*[.])?[0-9]*$/.test(text)

export const regexIsIP = text => /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(text)