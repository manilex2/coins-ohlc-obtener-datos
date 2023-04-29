const { Sequelize, Op } = require('sequelize');
const { database } = require('./keys');
const mysql = require("mysql2");
const OHLCModel = require('./models/ohlc');
const CoinsModel = require('./models/coins');
const Promise = require("bluebird");

const sequelize = new Sequelize(database.database, database.user, database.password, {
    host: database.host,
    port: database.port,
    dialectModule: mysql,
    dialect: "mysql",
    Promise: Promise
});

const OHLC = OHLCModel(sequelize, Sequelize);
const Coins = CoinsModel(sequelize, Sequelize);

const Models = { 
    sequelize
    , OHLC
    , Coins
    , Op
}

const connection = {}

module.exports = async () => {
    if (connection.isConnected) {
        console.log('=> Using existing connection.');
        return Models;
    }   
    await sequelize.sync();
    await sequelize.authenticate();
    connection.isConnected = true;
    console.log('=> Created a new connection.');
    return Models;
}