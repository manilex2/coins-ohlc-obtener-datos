const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('OHLC', {
        id: {
            type: DataTypes.INTEGER,
            field: "id",
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "name",
        },
        fecha: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "fecha",
        },
        open: {
            type: DataTypes.NUMBER,
            allowNull: false,
            field: "open",
        },
        high: {
            type: DataTypes.NUMBER,
            allowNull: false,
            field: "high",
        },
        low: {
            type: DataTypes.NUMBER,
            allowNull: false,
            field: "low",
        },
        close: {
            type: DataTypes.NUMBER,
            allowNull: false,
            field: "close",
        },
    }, {
        tableName: `${process.env.TABLE_OHLC}`,
        timestamps: false,
        indexes: [{
            unique: true,
            fields: ["name", "fecha"]
        }]
    });
}