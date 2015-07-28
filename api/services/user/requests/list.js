'use strict';


/**
 * The user request list service
 */




/**
 * Create the query with filters
 * 
 * @param {listItemsService} service
 * @param {array} params      query parameters if called by controller
 *
 * @return {Query}
 */
var query = function(service, params) {

    if (params['status.deleted'] === undefined) {
        params['status.deleted'] = [null, 'waiting'];
    } else if (!(params['status.deleted'] instanceof Array)) {
        params['status.deleted'] = [params['status.deleted']];
    }

    var find = service.app.db.models.Request.find();
    find.where('status.deleted').in(params['status.deleted']);

    if (params.user)
    {
         find.where({ 'user.id': params.user });
    }

    find.populate('absence.distribution');
    find.populate('events');
    find.populate('user.id');

    return find;
};




exports = module.exports = function(services, app) {
    
    var service = new services.list(app);
    
    /**
     * Call the requests list service
     * 
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {

        var find = query(service, params)
            .select('user timeCreated createdBy events absence time_saving_deposit workperiod_recover approvalSteps status')
            .sort('timeCreated');
        

        service.resolveQuery(find, paginate, function(err, docs) {

            var docsObj = [];

            if (!err && undefined !== docs) {

                for(var i=0; i<docs.length; i++) {
                    var reqObj = docs[i].toObject();
                    reqObj.status.title = docs[i].getDispStatus();
                    docsObj.push(reqObj);
                }

                /*
                docsObj = docs.map(function(request) {
                    var reqObj = request.toObject();
                    reqObj.status.title = request.getDispStatus();
                    return reqObj;
                });
                */
            }

            service.mongOutcome(err, docsObj);
        });

        return service.deferred.promise;
    };
    
    
    return service;
};




