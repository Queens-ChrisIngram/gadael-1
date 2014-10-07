'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.get(app);
    
    /**
     * Call the right renewal get service
     * 
     * @param {Object} params
     * @return {Promise}
     */
    service.call = function(params) {
        
        service.models.RightRenewal
        .findOne({ '_id' : params.id}, 'right start finish')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(service.gt.gettext('This right renewal periods does not exists'));
                }
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};

