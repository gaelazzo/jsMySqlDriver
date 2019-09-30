/*globals describe,beforeEach,it,expect,jasmine,spyOn,afterEach,xit,progress*/

"use strict";
var $dq = require("jsDataQuery");
var _ = require("lodash");

var fs = require("fs");
var path = require("path");

/**
 * ******************************************************************************************
 * VERY IMPORTANT VERY IMPORTANT VERY IMPORTANT VERY IMPORTANT VERY IMPORTANT VERY IMPORTANT
 * ******************************************************************************************
 * It's necessary, before start running the test, to create a file templated like:
 *  { "server": "db server address",
 *    "dbName": "database name",  //this must be an EMPTY database
 *    "user": "db user",
 *    "pwd": "db password"
 *  }
 */
//PUT THE  FILENAME OF YOUR FILE HERE:
var configName = path.join('test', 'db.json');
var dbConfig;
if (process.env.TRAVIS){
    dbConfig = { "server": "127.0.0.1",
        "dbName": "test",
        "user": "root",
        "pwd": ""
    };
}
else {
    dbConfig = JSON.parse(fs.readFileSync(configName).toString());
}


var mySqlDriver = require('../../src/jsMySqlDriver'),
    IsolationLevel = {
        readUncommitted: 'READ_UNCOMMITTED',
        readCommitted: 'READ_COMMITTED',
        repeatableRead: 'REPEATABLE_READ',
        snapshot: 'SNAPSHOT',
        serializable: 'SERIALIZABLE'
    };


describe('MySqlDriver ', function () {
    var sqlConn,
        dbInfo = {
            good: {
                server: dbConfig.server,
                useTrustedConnection: false,
                user: dbConfig.user,
                pwd: dbConfig.pwd,
                database: dbConfig.dbName
            },
            bad: {
                server: dbConfig.server,
                useTrustedConnection: false,
                user: dbConfig.user,
                pwd: dbConfig.pwd + 'AA',
                database: dbConfig.dbName
            }
        };


    function getConnection(dbCode) {
        var options = dbInfo[dbCode];
        if (options) {
            options.dbCode = dbCode;
            return new mySqlDriver.Connection(options);
        }
        return undefined;
    }

    beforeEach(function (done) {
        sqlConn = getConnection('good');
        sqlConn.open().done(function () {
                done();
            })
            .fail(function (err) {
                console.log('Error failing '+err);
                done();
            });
    }, 30000);

    afterEach(function () {
        if (sqlConn) {
            sqlConn.destroy();
        }
        sqlConn = null;
    });


    describe('setup dataBase', function () {
        it('should run the setup script', function (done) {
            sqlConn.run(fs.readFileSync(path.join('test', 'setup.sql')).toString())
                .done(function () {
                    expect(true).toBeTruthy();
                    done();
                })
                .fail(function (res) {
                    expect(res).toBeUndefined();
                    done();
                });
        }, 30000);

    });


    describe('structure', function () {


        it('should be defined', function () {
            expect(mySqlDriver).toEqual(jasmine.any(Object));
        });

        it('Connection should be a function', function () {
            expect(mySqlDriver.Connection).toEqual(jasmine.any(Function));
        });

        it('Connection should be a Constructor function', function () {
            expect(mySqlDriver.Connection.prototype.constructor).toEqual(mySqlDriver.Connection);
        });

        it('Connection() should return an object', function (done) {
            expect(sqlConn).toEqual(jasmine.any(Object));
            done();
        });

        it('Connection.open should be a function', function (done) {
            expect(sqlConn.open).toEqual(jasmine.any(Function));
            done();
        });
    });

    describe('open', function () {


        it('open should return a deferred', function (done) {
            sqlConn.open()
                .done(function () {
                    expect(true).toBe(true);
                    sqlConn.destroy();
                    done();
                })
                .fail(function () {
                    expect(true).toBe(true);
                    sqlConn.destroy();
                    done();
                });

        });


        it('open with  right credential should return a success', function (done) {
            var goodSqlConn = getConnection('good');
            goodSqlConn.open()
                .done(function () {
                    expect(true).toBe(true);
                    goodSqlConn.destroy();
                    done();
                })
                .fail(function (errMess) {
                    expect(errMess).toBeUndefined();
                    done();
                });

        });

        it('open with bad credential should return an error', function (done) {
            var badSqlConn = getConnection('bad');
            badSqlConn.open()
                .done(function (res) {
                    expect(res).toBe(undefined);
                    expect(true).toBe(false);
                    done();
                })
                .fail(function (errMess) {
                    expect(errMess).toBeDefined();
                    done();
                });

        }, 3000);
    });



    describe('transactions', function () {


        it('set transaction isolation level should call queryBatch', function (done) {
            spyOn(sqlConn.edgeConnection, 'queryBatch').andCallThrough();
            sqlConn.setTransactionIsolationLevel(IsolationLevel.readCommitted)
                .done(function () {
                    expect(sqlConn.edgeConnection.queryBatch).toHaveBeenCalled();
                    done();
                })
                .fail(function (err) {
                    expect(err).toBeUndefined();
                    done();
                });
        });

        it('consecutive set transaction with same isolation level should not call queryBatch', function (done) {
            spyOn(sqlConn.edgeConnection, 'queryBatch').andCallThrough();
            expect(sqlConn.edgeConnection.queryBatch.callCount).toEqual(0);
            sqlConn.setTransactionIsolationLevel(IsolationLevel.readCommitted)
                .then(function () {
                    expect(sqlConn.edgeConnection.queryBatch.callCount).toEqual(1);
                    return sqlConn.setTransactionIsolationLevel(IsolationLevel.readCommitted);
                })
                .then(function () {
                    expect(sqlConn.edgeConnection.queryBatch.callCount).toEqual(1);
                    return sqlConn.setTransactionIsolationLevel(IsolationLevel.repeatableRead);
                })
                .then(function () {
                    expect(sqlConn.edgeConnection.queryBatch.callCount).toEqual(2);
                    return sqlConn.setTransactionIsolationLevel(IsolationLevel.repeatableRead);
                })
                .then(function () {
                    expect(sqlConn.edgeConnection.queryBatch.callCount).toEqual(2);
                    done();
                })
                .fail(function (err) {
                    expect(err).toBeUndefined();
                    done();
                });
        });

        it('begin transaction should return success', function (done) {
            sqlConn.beginTransaction(IsolationLevel.repeatableRead)
                .done(function () {
                    expect(true).toBe(true);
                    sqlConn.rollBack();
                    done();
                })
                .fail(function (err) {
                    expect(err).toBeUndefined();
                    done();
                });
        });


        it('rollback transaction should fail without open conn', function (done) {
            var closedSqlConn = getConnection('good');
            closedSqlConn.rollBack()
                .done(function () {
                    expect(true).toBe(false);
                    done();
                })
                .fail(function (err) {
                    expect(err).toContain('closed');
                    done();
                });
        });

        it('rollback transaction should fail without begin tran', function (done) {
            sqlConn.open()
                .then(function () {
                    sqlConn.rollBack()
                        .done(function (res) {
                            expect(res).toBe(undefined);
                            sqlConn.destroy();
                            done();
                        })
                        .fail(function (err) {
                            expect(err).toBeDefined();
                            sqlConn.destroy();
                            done();
                        });
                });
        });

        it('rollback transaction should success with a begin tran', function (done) {
            sqlConn.beginTransaction(IsolationLevel.repeatableRead)
                .then(function () {
                    sqlConn.rollBack()
                        .done(function () {
                            expect(true).toBe(true);
                            done();
                        })
                        .fail(function (err) {
                            expect(err).toBeUndefined();
                            done();
                        });
                });
        });

    });

    describe('commands', function () {


        it('getDeleteCommand should compose a delete', function () {
            expect(sqlConn.getDeleteCommand(
                {
                    tableName: 'customer',
                    filter: $dq.eq('idcustomer', 2)
                }
            )).toEqual('DELETE FROM customer WHERE (idcustomer=2)');
        });

        it('getInsertCommand should compose an insert', function () {
            expect(sqlConn.getInsertCommand('ticket',
                ['col1', 'col2', 'col3'],
                ['a', 'b', 'c']
            )).toEqual('INSERT INTO ticket(col1,col2,col3)VALUES(\'a\',\'b\',\'c\')');
        });

        it('getUpdateCommand should compose an update', function () {
            expect(sqlConn.getUpdateCommand({
                table: 'ticket',
                filter: $dq.eq('idticket', 1),
                columns: ['col1', 'col2', 'col3'],
                values: ['a', 'b', 'c']
            })).toEqual('UPDATE ticket SET col1=\'a\',col2=\'b\',col3=\'c\' WHERE (idticket=1)');
        });

        /*
         CREATE PROCEDURE testSP2
         @esercizio int,   @meseinizio int,   @mess varchar(200),   @defparam decimal(19,2) =  2
         AS
         BEGIN
         select 'aa' as colA, 'bb' as colB, 12 as colC , @esercizio as original_esercizio,
         replace(@mess,'a','z') as newmess,   @defparam*2 as newparam
         END
         */
        it('callSPWithNamedParams should have success', function (done) {
            sqlConn.callSPWithNamedParams({
                    spName: 'testSP2',
                    paramList: [
                        {name: 'esercizio', value: 2013},
                        {name: 'meseinizio', value: 1},
                        {name: 'mess', value: 'ciao JS'},
                        {name: 'defparam', value: 10}
                    ]})
                .progress(function (x) {
                    expect(x).toBeUndefined();
                })
                .done(function (res) {
                    expect(_.isArray(res)).toBeTruthy();
                    expect(res.length).toBe(1);
                    var o = res[0];
                    //noinspection JSUnresolvedVariable
                    expect(o.colA).toBe('aa');
                    /*jshint camelcase: false */
                    //noinspection JSUnresolvedVariable
                    expect(o.original_esercizio).toBe(2013);
                    //noinspection JSUnresolvedVariable
                    expect(o.newparam).toEqual(20.0);
                    //noinspection JSUnresolvedVariable
                    expect(o.newmess).toBe('cizo JS');
                    done();
                })
                .fail(function (err) {
                    expect(err).toBeUndefined();
                    done();
                });
        });

        //CREATE PROCEDURE testSP2 (IN esercizio int,IN meseinizio int,IN mess varchar(200),IN defparam decimal(19,2) )
        it('callSPWithNamedParams should FAIL  - param order does matter - named params not supported', function (done) {
            sqlConn.callSPWithNamedParams({
                    spName: 'testSP2',
                    paramList: [
                        {name: 'defparam', value: 10},
                        {name: 'mess', value: 'ciao JS'},
                        {name: 'esercizio', value: 2013},
                        {name: 'meseinizio', value: 1}
                    ]
                })
                .progress(function (x) {
                    expect(x).toBeUndefined();
                })
                .done(function (res) {
                    expect(_.isArray(res)).toBeTruthy();
                    expect(res.length).toBe(1);
                    var o = res[0];
                    expect(o.newmess).toBe('2013');
                    done();
                })
                .fail(function (err) {
                    expect(err).toBeDefined();
                    done();
                });
        });


        /*
         CREATE PROCEDURE testSP1
         @esercizio int, @meseinizio int, @mesefine int out, @mess varchar(200), @defparam decimal(19,2) =  2
         AS
         BEGIN
         set @meseinizio= 12
         select 'a' as colA, 'b' as colB, 12 as colC , @esercizio as original_esercizio,
         replace(@mess,'a','z') as newmess,  @defparam*2 as newparam
         END

         */
        it('callSPWithNamedParams with output params should have success', function (done) {
            var table;
            sqlConn.callSPWithNamedParams({
                    spName: 'testSP1',
                    paramList: [
                        {name: 'esercizio', value: 2013},
                        {name: 'meseinizio', value: 2},
                        {name: 'mesefine', out: true, sqltype: 'int'},
                        {name: 'mess', value: 'ciao JS'},
                        {name: 'defparam', value: 10}
                    ]
                })
                .progress(function (res) {
                    table = res;
                    expect(_.isArray(res)).toBeTruthy();
                    expect(res.length).toBe(1);
                    var o = res[0];
                    //noinspection JSUnresolvedVariable
                    expect(o.colA).toBe('a');
                    /*jshint camelcase: false */
                    //noinspection JSUnresolvedVariable
                    expect(o.original_esercizio).toBe(2013);
                    //noinspection JSUnresolvedVariable
                    expect(o.newparam).toEqual(20.0);
                    //noinspection JSUnresolvedVariable
                    expect(o.newmess).toBe('cizo JS');
                })
                .done(function (o) {
                    //console.log(o);
                    expect(table).toBeDefined();
                    expect(_.isArray(o)).toBeTruthy();
                    expect(o.length).toBe(5);
                    expect(o[2].value).toBeUndefined();
                    expect(o[2].outValue).toBe(12);
                    done();
                })
                .fail(function (err) {
                    expect(err).toBeUndefined();
                    done();
                });
        });

    });



    describe('clear dataBase', function () {
        it('should run the destroy script', function (done) {
            sqlConn.run(fs.readFileSync(path.join('test','destroy.sql')).toString())
                .done(function () {
                    expect(true).toBeTruthy();
                    done();
                })
                .fail(function (res) {
                    expect(res).toBeUndefined();
                    done();
                });
        }, 30000);
    });
});
