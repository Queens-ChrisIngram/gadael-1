'use strict';


/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['user', 'quantity', 'events'])) {
        return;
    }

    const gt = service.app.utility.gettext;

    if (params.events.length === undefined || params.events.length < 1) {
        return service.error(gt.gettext('At least one event is required'));
    }

    params.events.forEach(event => {
        if (service.needRequiredFields(event, ['dtstart', 'dtend', 'summary', 'user'])) {
            return;
        }
    });

    if (params.id) {
        saveOvertime(service, params)
        .then(overtime => {
            return service.resolveSuccessGet(
                overtime._id,
                gt.gettext('The overtime has been created')
            );
        })
        .catch(service.error);
    } else {
        // Save events only on overtime creation
        createEvents(service, params.events)
        .then(events => {
            return saveOvertime(service, params)
            .then(overtime => {
                updateEvents(events, overtime)
                .then(() => {
                    return service.resolveSuccessGet(
                        overtime._id,
                        gt.gettext('The overtime has been created')
                    );
                });
            });
        })
        .catch(service.error);
    }
}

/**
 * Save events to database
 * @param {apiService} service
 * @param {Array} events List of events from params
 * @return {Promise}
 */
function createEvents(service, events) {
    const UserModel = service.app.db.models.User;
    const CalendarEventModel = service.app.db.models.CalendarEvent;
    const userId = events[0].user.id === undefined ? events[0].user : events[0].user.id;
    return UserModel.findOne({ _id: userId })
    .then(user => {
        return Promise.all(events.map(params => {
            const event = new CalendarEventModel();
            event.set(params);
            event.user = {
                id: user._id,
                name: user.getName()
            };
            event.status = 'CONFIRMED';
            event.overtime = null; // will be updated
            return event.save();
        }));
    });
}

/**
 * Update the overtime back-reference in the events
 * @param {Array} events List of events created in database
 * @param {Overtime} overtime
 */
function updateEvents(events, overtime) {
    return Promise.all(events.map(event => {
        event.overtime = overtime._id;
        return event.save();
    }));
}

/**
 * Update/create the overtime document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveOvertime(service, params) {
    const UserModel = service.app.db.models.User;
    const OvertimeModel = service.app.db.models.Overtime;
    const gt = service.app.utility.gettext;
    const userId = params.user.id === undefined ? params.user : params.user.id;
    return UserModel.findOne({ _id: userId })
    .populate('department')
    .exec()
    .then(user => {
        if (!user) {
            return service.error(gt.gettext('The user does not exists'));
        }

        var fieldsToSet = {
            user: {
                id: user._id,
                name: user.getName()
            },
            quantity: params.quantity
        };

        if (user.department) {
            fieldsToSet.user.department = user.department.name;
        }

        if (params.settled) {
            fieldsToSet.settled = params.settled;
        }

        if (params.id) {
            return OvertimeModel.findOne({ _id: params.id }, overtime => {
                if (overtime.settled) {
                    return service.forbidden(gt.gettext('The overtime is settled'));
                }

                overtime.set(fieldsToSet);
                return overtime.save();
            });

        } else {
            const overtime = new OvertimeModel();
            overtime.set(fieldsToSet);
            return overtime.save();
        }
    });
}


/**
 * Construct the calendar save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {
    const service = new services.save(app);

    /**
     * Call the calendar save service
     *
     * @param {Object} params
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        validate(service, params);
        return service.deferred.promise;
    };


    return service;
};
