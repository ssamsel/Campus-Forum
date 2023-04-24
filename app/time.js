export class Timestamp {
    constructor() {
        this.date = new Date();
    }
    // [year, month, dayofmonth, hour, minute]
    now() {
        return [
            this.date.getFullYear(),
            this.date.getMonth(),
            this.date.getDate(),
            this.date.getHours(),
            this.date.getMinutes(),
        ];
    }

    convertToRecencyString(timestamp) {
        const nowTS = this.now();
        const diff = [];
        nowTS.forEach((val, idx) => {
            diff.push(Math.abs(timestamp[idx] - val));
        });

        if (diff[0] > 0){
           return diff[0].toString() + " year" + this._plural(diff[0]) + "ago";
        }
        if (diff[1] > 0){
           return diff[1].toString() + " month" + this._plural(diff[1]) + "ago";
        }
        if (diff[2] > 0){
           return diff[2].toString() + " day" + this._plural(diff[2]) + "ago";
        }
        if (diff[3] > 0){
           return diff[3].toString() + " hour" + this._plural(diff[3]) + "ago";
        }
        return diff[4].toString() + " minute" + this._plural(diff[3]) + "ago";
    }

    // compare function for array sorting
    // a and b are both forum entries
    compare(a, b){
       function reducer(acc, val, idx){
        return acc + val * Math.pow(100, 5-idx); 
       }

       return b.time.reduce(reducer, 0) - a.time.reduce(reducer, 0);
    }

    _plural(num){
        return num != 1 ? "s " : " ";
    }

}