'use strict';

const ValueObject = require('value-object');

class Store extends ValueObject.define({
    id: 'string',
    complexNumber: 'string',
    longitude: 'number',
    latitude: 'number',
}) {}

module.exports = Store;

