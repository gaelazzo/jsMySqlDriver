# jsMySqlDriver
Javascript Sql Server driver. Allows you to read/write and do anything you want with a mySql database using javascript.
Every command returns a promise of a [jQuery Deferred object](https://www.npmjs.com/package/JQDeferred)

Some of the available method are



## setTransactionIsolationLevel(isolationLevel) ##
Sets the Transaction isolation level for current connection

## checkLogin(login, password)   ##
Check login/password, returns true if successful, false if user/password does not match

## open() ##
Opens the underlying connection and sets the current specified schema
 
## close() ##
Closes the underlying connection

## queryBatch(query[, raw]) ##
Executes a sql command and returns all sets of results. Each Results is given via a notify or resolve

- @param {string} query sql command to execute

- @param {boolean} [raw] if true, data are left in raw state and will be objectified by the client
 
- @returns {*}  a sequence of {[array of plain objects]} or {meta:[column names],rows:[arrays of raw data

## queryLines(query[,raw]) ##
Gets a table and returns each SINGLE row by notification. Can return more than a table 

 * For each table read emits a {meta:[column descriptors]} notification, and for each row of data emits a series of
 *   {row:object read from db} if raw= false
 *   {row: [array of values read from db]} if raw= true

## queryPackets(query, raw, packSize) ##
Gets data with a query getting (max) n row at a time
 


## updateBatch(query) ##
Executes a series of sql update/insert/delete commands


## beginTransaction (isolationLevel) ##
Begins a transaction

## commit() ##
Commits a transaction
 
## rollBack() ##
RollBacks a transaction
  

## getSelectCommand (options) ##
Get the string representing a select command

 * @param {object} options
 * @param {string} options.tableName
 * @param {string} options.columns
 * @param {sqlFun} [options.filter]
 * @param {string} [options.top]
 * @param {string} [options.orderBy]
 * @param {object} [options.environment]
 * @returns {string}

sqlFun is an object used in [jsDataQuery](https://github.com/gaelazzo/jsDataQuery "jsDataQuery")

## getSelectCount(options) ##
Get the string representing a select count(*) command
 
 * @param {object} options
 * @param {string} options.tableName
 * @param {sqlFun} [options.filter]
 * @param {object} [options.environment]
 * @returns {string}


## getDeleteCommand(options) ##
Get the string representing a delete command

 * @param {object} options
 * @param {string} options.tableName
 * @param {sqlFun} [options.filter]
 * @param {object} [options.environment]
 * @returns {string}

## getInsertCommand(options) ##
Get the string representing an insert command

 * @param {string} table
 * @param {Array} columns
 * @param {Array} values
 * @returns {string}

## getUpdateCommand(options) ##
Get the string representing an update command
 
 * @param {object} options
 * @param {string} options.table
 * @param {sqlFun} options.filter
 * @param {Array} options.columns
 * @param {Array} options.values
 * @param {object} [options.environment]
 * @returns {string}

## callSPWithNamedParams(options) ##
Call SP with a list of parameters each of which is an object having:

 *  value,
 *  optional 'sqltype' name compatible with the used db, necessary if is an output parameter
 *  optional out: true if it is an output parameter
 
The SP eventually returns a collection of tables and (finally) an object with a property for each output parameter of the SP

 
 * @param {object} options
 * @param {string} options.spName
 * @param {Array} options.paramList
 * @param {boolean} [options.raw=false]
 * @returns {Array}

## tableDescriptor(tableName) ##
Gets information about a db table
 * @param {string} tableName
 * @returns {Array}
 * The result has columns: DBO, name, type, len, precision, scale, is_nullable, pk


## getFormatter ##
Gets the sqlFormatter for this kind of connection. This returns a jsSqlServerFormatter (see [jsSqlServerFormatter](https://github.com/gaelazzo/jsSqlServerFormatter "jsSqlServerFormatter"). 
This is  meant to be used in [jsDataQuery](https://github.com/gaelazzo/jsDataQuery )

## run(script) ##
Runs a sql script, eventually composed of multiple blocks separed by GO lines
 * @param {string} script

see test specs for examples of use


![](https://travis-ci.org/gaelazzo/jsMySqlDriver.svg?branch=master)
