var Q = require('q');

/**
 * @param {Account} account mongoose document
 * @param {RightRenewal} renewal the vacation right attribution with right populated
 *
 */
function accountRight(account, renewal)
{
    'use strict';


    this.account = account;
    this.right = renewal.right;
    this.renewal = renewal;

}



/**
 * Sum of consumed quantities from waiting requests
 * @return {Promise}    Number
 */
accountRight.prototype.getWaitingQuantity = function()
{
    'use strict';

    var deferred = Q.defer();
    var AbsenceElemModel = this.renewal.model('AbsenceElem');

    AbsenceElemModel
        .find({ 'right.renewal': this.renewal._id, 'user.id': this.account.user.id })
        .exec(function(err, elements) {

        var consumed = 0;

        for(var i=0; i<elements.length; i++) {
            consumed += elements[i].consumedQuantity;
        }

        deferred.resolve(consumed);
    });

    return deferred.promise;
};

 /**
 * Sum of consumed quantities from confirmed requests
 * @return {Promise}    Number
 */
accountRight.prototype.getConfirmedQuantity = function()
{
    'use strict';

    var deferred = Q.defer();

    return deferred.promise;
};

/**
 * @return {Promise}    Number
 */
accountRight.prototype.getConsumedQuantity = function()
{
   'use strict';

    var deferred = Q.defer();
    var AbsenceElemModel = this.renewal.model('AbsenceElem');

    AbsenceElemModel
        .find({ 'right.renewal': this.renewal._id, 'user.id': this.account.user.id })
        .exec(function(err, elements) {

        var consumed = 0;

        for(var i=0; i<elements.length; i++) {
            consumed += elements[i].consumedQuantity;
        }

        deferred.resolve(consumed);
    });

    return deferred.promise;
};


/**
 * @return {Promise}    Number
 */
accountRight.prototype.getAvailableQuantity = function()
{
    'use strict';

    var deferred = Q.defer();

    // Is there a specific quantity for this beneficiary and this renewal?
    // else get the right quantity

    // TODO

    return deferred.promise;
};




exports = module.exports = accountRight;
