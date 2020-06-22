'use strict';

class JumboEndpoints {
    static BASE_URL = 'https://mobileapi.jumbo.com/';
    static VERSION = 'v9';
    static AUTHENTICATE_URL = this.VERSION + '/users/login';
    static PROFILE_URL = this.VERSION + '/users/me';
    static DELIVERY_TIME_SLOTS_URL = this.VERSION + '/stores/slots?storeId={storeId}&fulfilment=homeDelivery&limit=7';
    static PICK_UP_TIME_SLOTS_URL = this.VERSION + '/stores/slots?storeId={storeId}&fulfilment=collection&limit=7';
    static ORDERS_URL = this.VERSION + '/users/me/orders';
    static ORDER_DETAILS_URL = this.VERSION + '/users/me/orders/{orderId}';
    static BASKET_URL = this.VERSION + '/basket?withMOV=false';
    static ADD_PRODUCT_URL = this.VERSION + '/basket';
}

module.exports = JumboEndpoints;
