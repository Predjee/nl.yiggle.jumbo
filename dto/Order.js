'use strict';

const ValueObject = require('value-object');

class Order extends ValueObject.define({
    orderId: 'string',
    orderAvailableDate: 'string',
    orderAvailableStartTime: 'string',
    orderAvailableEndTime: 'string',
    readableTime: 'string',
}) {}

module.exports = Order;
