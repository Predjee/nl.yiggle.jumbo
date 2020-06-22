'use strict';

const Homey = require('homey');
const axios = require('axios');
const endpoints = require('../endpoints/JumboEndpoints');
const Store = require('../dto/Store');
const Order = require('../dto/Order');
const Price = require('../dto/Price');
const NodeCache = require("node-cache");
const myCache = new NodeCache();
const hash = require('object-hash');

class JumboApi {

    constructor(settings) {
        this.token = null;
        this.username = settings.username || null;
        this.password = settings.password || null;
        this.store = settings.store || null;
    }

    async deliveryOptions() {
        await this.syncStore().then(result => {
            this.store = result;
            Homey.ManagerSettings.set('store', this.store);
        });

        return await this.requestData(endpoints.DELIVERY_TIME_SLOTS_URL.replace('{storeId}', this.store.id))
            .then((result) => {

                return result;
            });
    }

    async orders() {
        return await this.requestData(endpoints.ORDERS_URL.replace('{storeId}', this.store.id))
            .then((result) => {
                return result;
            });
    }

    async syncStore() {
        return await this.requestData(endpoints.PROFILE_URL)
            .then((result) => {
                let store = result.user.data.store;
                return new Store({
                    id: store.id,
                    complexNumber: store.complexNumber,
                    longitude: store.longitude,
                    latitude: store.latitude,
                });
            });
    }

    async requestLogin() {
        const options = {
            baseURL: endpoints.BASE_URL,
            url: endpoints.AUTHENTICATE_URL,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            params: {
                username: this.username,
                password: this.password
            }
        }

        const getToken = async () => {
            try {
                const response = await axios.request(options);

                return response.headers['x-jumbo-token'];
            } catch (error) {
                console.log('error token');
            }
        };

        return getToken();
    }

    async requestData(url) {
        if (!this.token) {
            await this.requestLogin().then((result) => {
                this.token = result;
            });
        }

        const options = {
            baseURL: endpoints.BASE_URL,
            url: url,
            method: 'GET',
            headers: {
                "x-jumbo-token": this.token,
                "Content-Type": "application/json",
            }
        }

        const getData = async () => {
            try {
                const response = await axios.request(options);

                return response.data;
            } catch (error) {
                console.log(error);
            }
        };

        return getData();
    }

    async orderStatus() {
        const activeOrderStatusses = ["OPEN", "PROCESSING", "READY_TO_DELIVER", "READY_TO_PICK_UP"];
        let tmpCacheHashes = [];

        return await this.orders().then(result => {
            let activeOrders = [];
            result.orders.data.forEach(order => {
                if (activeOrderStatusses.includes(order.status)) {
                    let orderData = order.type === 'collection' ? order.pickup : order.delivery;
                    let singleOrder = new Order({
                        orderId: order.id,
                        orderAvailableDate: new Date(orderData.date),
                        orderAvailableStartTime: new Date(orderData.startDateTime),
                        orderAvailableEndTime: new Date(orderData.endDateTime),
                        readableTime: orderData.time,
                    });

                    activeOrders.push(singleOrder);
                    tmpCacheHashes[order.id] = hash(singleOrder);
                }
            });

            let updatedOrders = [];
            activeOrders.forEach(function (singleOrder) {
                const orderHash = myCache.get(singleOrder.orderId);
                if (orderHash === undefined || orderHash !== tmpCacheHashes[singleOrder.orderId]) {
                    updatedOrders.push(singleOrder);
                    myCache.set(singleOrder.orderId, tmpCacheHashes[singleOrder.orderId]);
                }
            })

            return updatedOrders;
        });
    }

    async getCurrentBasket() {
        return await this.requestData(endpoints.BASKET_URL)
            .then((result) => {
                console.log(result.basket.data.items);
                console.log(result.basket.data.prices);
                console.log(result.basket.data.usedPriceLine);
            });

    }

    async addProductToCart(sku) {
        if (!this.token) {
            await this.requestLogin().then((result) => {
                this.token = result;
            });
        }

        const options = {
            baseURL: endpoints.BASE_URL,
            url: endpoints.ADD_PRODUCT_URL,
            method: 'POST',
            headers: {
                "x-jumbo-token": this.token,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            params: {
                sku: sku,
                unit: 'pieces',
                quantity: 1
            }
        }

        const getStatus = async () => {
            try {
                const response = await axios.request(options);
                console.log(response.data);
                return response.data;
            } catch (error) {
                console.log(error);
            }
        };

        return getStatus();
    }
}

module.exports = JumboApi;
