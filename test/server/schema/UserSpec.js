'use strict';

var helpers = require('./mockDatabase');
var app;

describe('User model', function() {


    var userModel, managerModel;
    var userDocument, userManagerDocument, manager;
    var department1, department2;
    var collection;


    beforeEach(function(done) {
        helpers.mockDatabase('userSpec', function(mockapp) {
            app = mockapp;

            userModel = app.db.models.User;
            managerModel = app.db.models.Manager;

            done();
        });
    });


    it('create a random test user', function(done) {
        userModel.createRandom('secret', function(err, user) {
            userDocument = user;
            done();
        });
    });


    it('add the account role', function(done) {
        var account = new app.db.models.Account();
        account.save(function(err, account) {
            userDocument.roles.account = account._id;
            userDocument.save(function(err, saved) {
                expect(err).toEqual(null);
                done();
            });
        });


    });


    it('check departments ancestors without departments', function(done) {
        userDocument.getDepartmentsAncestors().then(function(arr) {
            expect(arr.length).toEqual(0);
            done();
        });
    });


    it('set a department on test user', function(done) {

        function saveToUser(department) {
            userDocument.department = department._id;
            userDocument.save(function(err) {
                expect(err).toEqual(null);
                department1 = department;
                done();
            });
        }

        app.db.models.Department.findOne().where('name', 'R & D').exec(function(err, department) {
            expect(err).toEqual(null);
            if (department) {
                department.save(function(err) {
                    saveToUser(department);
                });
                return;
            }

            department = new app.db.models.Department();
            department.name = 'R & D';
            department.save(function(err) {
                expect(err).toEqual(null);
                saveToUser(department);


            });
        });
    });


    it('check departments ancestors with one department', function(done) {
        userDocument.getDepartmentsAncestors().then(function(arr) {
            expect(arr.length).toEqual(1);
            done();
        });
    });


    it('create a parent department', function(done) {

        function saveToDepartment1(department) {
            department1.parent = department;
            department1.save(function(err) {
                expect(err).toEqual(null);
                department2 = department;
                done();
            });
        }


        app.db.models.Department.findOne().where('name', 'France').exec(function(err, department) {
            expect(err).toEqual(null);
            if (department) {
                return saveToDepartment1(department);
            }

            department = new app.db.models.Department();
            department.name = 'France';
            department.save(function(err) {
                expect(err).toEqual(null);
                saveToDepartment1(department);
            });
        });
    });


    it('check departments ancestors with two department', function(done) {
        userDocument.getDepartmentsAncestors().then(function(arr) {
            expect(arr.length).toEqual(2);
            done();
        });
    });


    it('Create a manager', function(done) {
        userModel.createRandom('secret', function(err, user) {
            manager = new managerModel();
            manager.user = {
                    id: user._id,
                    name: user.getName()
                };
            manager.department = [department2._id];

            manager.save(function(err, managerDocument) {
                user.roles = {
                    manager: managerDocument._id
                };

                user.save(function(err, userManager) {
                    expect(err).toEqual(null);
                    expect(userManager.roles.manager).toEqual(managerDocument._id);
                    userManagerDocument = userManager;
                    done();
                });
            });


        });
    });


    it('verify manager of a user', function(done) {
        userManagerDocument.populate('roles.manager', function(err, populatedManager) {
            populatedManager.isManagerOf(userDocument).then(function(status) {
                expect(status).toBeTruthy();
                done();
            }).catch(function(err) {
                expect(err.toString()).toEqual(null);
                done();
            });
        });

    });



    it('verify manager can spoof user to edit requests with the default settings', function(done) {
        userManagerDocument.canSpoofUser(userDocument).then(function(status) {
            expect(status).toBeTruthy();
            done();
        }).catch(function(err) {
            expect(err.toString()).toEqual(null);
            done();
        });
    });


    it('change setting in the company document', function(done) {

        app.db.models.Company.findOne({}, function(err, company) {

            expect(err).toEqual(null);
            expect(company).toBeDefined();
            if (!company) {
                expect(false).toEqual(true);
                done();
                return;
            }

            if (null === company.manager_options) {
                company.manager_options = {};
            }

            company.manager_options.edit_request = false;
            company.save(function(err) {
                expect(err).toEqual(null);
                done();
            });
        });

    });


    it('verify manager cannot spoof user to edit request with the modified setting', function(done) {
        userManagerDocument.canSpoofUser(userDocument).then(function(status) {
            expect(status).toBeFalsy();
            done();
        }).catch(function(err) {
            expect(err).toEqual(null);
            done();
        });
    });


    it('create a test collection', function(done) {
        collection = new app.db.models.RightCollection();
        collection.name = 'test for UserSpec';
        collection.save(function(err) {
            expect(err).toEqual(null);
            done();
        });
    });


    it('link userDocument to a collection', function(done) {

        var accountCollection = new app.db.models.AccountCollection();
        accountCollection.account = userDocument.roles.account;
        accountCollection.rightCollection = collection._id;

        accountCollection.from = new Date();

        accountCollection.save(function(err, doc) {
            expect(err).toEqual(null);
            done();
        });
    });

    it('test the getAccountCollection method', function(done) {
        userDocument.getAccountCollection().then(function(accountCollection) {
            expect(accountCollection.rightCollection).toEqual(collection._id);
            done();
        }).catch(function(err) {
            expect(err).toEqual(null);
            done();
        });
    });



    it("should disconnect from the database", function(done) {

        department1.remove(function() {
            department2.remove(function() {
                app.disconnect(function() {
                    // and delete the test db
                    helpers.dropDb('userSpec', done);
                });
            });
        });
	});

});