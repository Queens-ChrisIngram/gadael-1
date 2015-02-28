'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    /**
     * Call the requests delete service
     * 
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        var Gettext = require('node-gettext');
        var gt = new Gettext();

        var filter = {
            _id: params.id,
            deleted: false
        };
        
        if (params.user) {
            filter['user.id'] = params.user;
        }
        
        
        service.app.db.models.Request.find(filter, function (err, document) {
            if (service.handleMongoError(err)) {
                
                document.deleted = true;
                document.save(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(gt.gettext('The request has been deleted'));
                        
                        var request = document.toObject();
                        request.$outcome = service.outcome;
                        
                        service.deferred.resolve(request);
                    }
                });
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};
