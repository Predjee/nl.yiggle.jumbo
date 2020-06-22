'use strict';

const ValueObject = require('value-object');

class Price extends ValueObject.define({
    currency: 'string',
    amount: 'number'
}) {}

module.exports = Price;
