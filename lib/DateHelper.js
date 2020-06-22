'use strict';


class DateHelper {
    static getNextDay(day, resetTime) {
        var days = {
            sunday: 0, monday: 1, tuesday: 2,
            wednesday: 3, thursday: 4, friday: 5, saturday: 6
        };

        var dayIndex = days[day.toLowerCase()];
        if (dayIndex === undefined) {
            throw new Error('"' + day + '" is not a valid input.');
        }

        var returnDate = new Date();
        var returnDay = returnDate.getDay();
        if (dayIndex === returnDay) {
            returnDate.setDate(returnDate.getDate() + 7);
        }

        returnDate.setDate(returnDate.getDate() + (dayIndex + (7 - returnDay)) % 7);

        if (resetTime) {
            returnDate.setHours(0);
            returnDate.setMinutes(0);
            returnDate.setSeconds(0);
            returnDate.setMilliseconds(0);
        }
        return returnDate;
    }

    static getDutchDay(day) {
        switch (day) {
            case 0: return 'zondag'
            case 1: return 'maandag'
            case 2: return 'dinsdag'
            case 3: return 'woensdag'
            case 4: return 'donderdag'
            case 5: return 'vrijdag'
            case 6: return 'zaterdag'
        }
    }

    static getDutchMonth(month) {
        switch (month) {
            case 0: return 'januari'
            case 1: return 'februari'
            case 2: return 'maart'
            case 3: return 'april'
            case 4: return 'mei'
            case 5: return 'juni'
            case 6: return 'juli'
            case 7: return 'augustus'
            case 8: return 'september'
            case 9: return 'oktober'
            case 10: return 'november'
            case 11: return 'december'
            default: return 'ergens in een maand'
        }
    }
}

module.exports = DateHelper;
