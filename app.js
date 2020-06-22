'use strict';

const Homey = require('homey');
const JumboApi = require("./lib/JumboApi");
const DateHelper = require("./lib/DateHelper");

class JumboSupermarket extends Homey.App {

    onInit() {
        let store = Homey.ManagerSettings.get('store');
        if (store.id === undefined) {
            store = null
        }

        this.jumbo = new JumboApi({
            username: Homey.ManagerSettings.get('username'),
            password: Homey.ManagerSettings.get('password'),
            store: store
        });

        this.tokens = {};

        this.deliveryStatus = new Homey.FlowCardTrigger('delivery_status').register();
        this.orderStatus().then(this.log('bezorg status gesynced')).catch(this.error);
        setInterval(this.orderStatus.bind(this), 60 * 1000 * 15);

        this.availabilityTokens().then(this.log('beschikbaarheid gesynced')).catch(this.error);
        setInterval(this.availabilityTokens.bind(this), 60 * 1000 * 5);
        // this.addProductToCart('211761ZK');
    }

    async addProductToCart() {
        let added = await this.jumbo.addProductToCart(1234);
        return await this.jumbo.getCurrentBasket();
    }

    async orderStatus() {
        let pollData = await this.jumbo.orderStatus();

        if (pollData.length > 0) {
            pollData.forEach(order => {
                const deliveryOrPickupDate = DateHelper.getDutchDay(order.orderAvailableDate.getDay()) + ' ' + order.orderAvailableDate.getDate() + ' ' + DateHelper.getDutchMonth(order.orderAvailableDate.getMonth());

                this.deliveryStatus
                    .trigger({
                        delivery_status: deliveryOrPickupDate + ' tussen ' + order.readableTime
                    })
                    .catch(function () {
                        console.error('Error met runnen leverings status')
                    })
                    .then(function () {
                        console.log('Levering gesynced!')
                    });
            });
        }
    }

    async availabilityTokens() {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        let tokenIndex = 'undefined';
        let tokens = [];
        Object.keys(this.tokens).forEach(key => {
            Homey.ManagerFlow.unregisterToken(this.tokens[key]).catch(this.error);
        })

        return await this.jumbo.deliveryOptions().then(result => {
            if (result.timeSlots === undefined) {
                return;
            }
            result.timeSlots.data.forEach(item => {
                let dateObj = new Date(item.day);
                days.forEach(day => {
                    let nextDay = DateHelper.getNextDay(day, true);
                    if (dateObj.getTime() !== nextDay.getTime()) {
                        return;
                    }

                    tokenIndex = 'delivery_next_' + day;
                    item.timeSlots.forEach(timeslot => {
                        if (timeslot.available === false) {
                            return;
                        }

                        let startTime = new Date(timeslot.startDateTime);
                        let formattedStartTime = startTime.getHours() + ':' + ("0" + startTime.getMinutes()).substr(-2);
                        let endTime = new Date(timeslot.endDateTime);
                        let formattedEndTime = endTime.getHours() + ':' + ("0" + endTime.getMinutes()).substr(-2);

                        if (tokens[tokenIndex] === undefined) {
                            tokens[tokenIndex] = [];
                        }
                        tokens[tokenIndex].push(formattedStartTime + ' tot ' + formattedEndTime);
                    })

                    let concattedTokenValue = Homey.ManagerSettings.get('no-timeslot').toString();
                    if (tokens[tokenIndex] !== undefined && tokens[tokenIndex].length > 0) {
                        concattedTokenValue = tokens[tokenIndex].join(' , ');
                    }

                    this.tokens[day] = new Homey.FlowToken('delivery_next_' + day, {
                        type: 'string',
                        title: 'Bezorgtijden komende ' + DateHelper.getDutchDay(nextDay.getDay()),
                        example: concattedTokenValue
                    });
                    this.tokens[day].register()
                        .then(() => {
                            return this.tokens[day].setValue(concattedTokenValue);
                        })
                        .catch(err => {
                            this.error(err);
                        });
                });
            });
        });
    }
}

module.exports = JumboSupermarket;
