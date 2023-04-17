const { DataTypes } = require('sequelize');

module.exports = (sequelize, type) => {
    return sequelize.define('Coins', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "id",
            primaryKey: true 
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "name",
        },
    }, {
        tableName: `${process.env.TABLE_COINS_LIST}`,
        timestamps: false
    });
}