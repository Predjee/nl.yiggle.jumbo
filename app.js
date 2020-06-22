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

        // this.deliveryStatus = new Homey.FlowCardTrigger('delivery_status');
        // this.orderStatus().then(this.log('bezorg status gesynced')).catch(this.error);
        // setInterval(this.orderStatus.bind(this), 60 * 1000 * 15);
        //
        // this.availabilityTokens().then(this.log('beschikbaarheid gesynced')).catch(this.error);
        // setInterval(this.availabilityTokens.bind(this), 60 * 1000 * 5);
        this.addProductToCart('211761ZK');
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
                    .register()
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
        const thursday = DateHelper.getNextDay('thursday', true);
        const friday = DateHelper.getNextDay('friday', true);
        const saturday = DateHelper.getNextDay('saturday', true);

        let tokens = {
            'delivery_next_thursday': [],
            'delivery_next_friday': [],
            'delivery_next_saturday': [],
        };

        let tokenIndex = 'undefined';

        return await this.jumbo.deliveryOptions().then(result => {
            if (result.timeSlots === undefined) {
                return;
            }
            result.timeSlots.data.forEach(item => {
                let dateObj = new Date(item.day);
                if (dateObj.getTime() === thursday.getTime()) {
                    tokenIndex = 'delivery_next_thursday';
                } else if (dateObj.getTime() === friday.getTime()) {
                    tokenIndex = 'delivery_next_friday';
                } else if (dateObj.getTime() === saturday.getTime()) {
                    tokenIndex = 'delivery_next_saturday';
                } else {
                    return;
                }

                item.timeSlots.forEach(timeslot => {
                    if (timeslot.available === false) {
                        return;
                    }

                    let startTime = new Date(timeslot.startDateTime);
                    let formattedStartTime = startTime.getHours() + ':' + ("0" + startTime.getMinutes()).substr(-2);
                    let endTime = new Date(timeslot.endDateTime);
                    let formattedEndTime = endTime.getHours() + ':' + ("0" + endTime.getMinutes()).substr(-2);
                    tokens[tokenIndex].push(formattedStartTime + ' tot ' + formattedEndTime);
                })
            });

            tokens.delivery_next_thursday = tokens.delivery_next_thursday.join(' van ').toString();
            if (tokens.delivery_next_thursday === '') {
                tokens.delivery_next_thursday = 'Geen mogelijkheden komende donderdag';
            } else {
                tokens.delivery_next_thursday = 'Mogelijke bezorgtijden komende donderdag ' + tokens.delivery_next_thursday;
            }

            tokens.delivery_next_friday = tokens.delivery_next_friday.join(' van ').toString();
            if (tokens.delivery_next_friday === '') {
                tokens.delivery_next_friday = 'Geen mogelijkheden komende vrijdag';
            } else {
                tokens.delivery_next_friday = 'Mogelijke bezorgtijden komende vrijdag ' + tokens.delivery_next_friday;
            }

            tokens.delivery_next_saturday = tokens.delivery_next_saturday.join(' van ').toString();
            if (tokens.delivery_next_saturday === '') {
                tokens.delivery_next_saturday = 'Geen mogelijkheden komende zaterdag';
            } else {
                tokens.delivery_next_saturday = 'Mogelijke bezorgtijden komende zaterdag ' + tokens.delivery_next_saturday;
            }

            Object.keys(this.tokens).forEach(key => {
                Homey.ManagerFlow.unregisterToken(this.tokens[key]).catch(this.error);
            })

            this.tokens['thursday'] = new Homey.FlowToken( 'delivery_next_thursday', {
                type: 'string',
                title: 'Bezorgtijden komende donderdag',
                example: tokens.delivery_next_thursday
            });
            this.tokens['thursday'].register()
                .then(() => {
                    return this.tokens['thursday'].setValue( tokens.delivery_next_thursday);
                })
                .catch( err => {
                    this.error( err );
                });

            this.tokens['friday'] = new Homey.FlowToken( 'delivery_next_friday', {
                type: 'string',
                title: 'Bezorgtijden komende vrijdag'
            });
            this.tokens['friday'].register()
                .then(() => {
                    return this.tokens['friday'].setValue( tokens.delivery_next_friday);
                })
                .catch( err => {
                    this.error( err );
                });

            this.tokens['saturday'] = new Homey.FlowToken( 'delivery_next_saturday', {
                type: 'string',
                title: 'Bezorgtijden komende zaterdag',
                example: tokens.delivery_next_saturday
            });
            this.tokens['saturday'].register()
                .then(() => {
                    return this.tokens['saturday'].setValue( tokens.delivery_next_saturday);
                })
                .catch( err => {
                    this.error( err );
                });
        });
    }
}

module.exports = JumboSupermarket;
