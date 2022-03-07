require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const mysql = require('mysql2');
const fetch = require('node-fetch');
const { database } = require('./keys');
const PUERTO = 4300;
const app = express();

app.use(morgan('dev'));

app.get('/', async (req, res) => {
    const conexion = mysql.createConnection({
        host: database.host,
        user: database.user,
        password: database.password,
        port: database.port,
        database: database.database
    });
    var sql = `SELECT name FROM ${process.env.TABLE_COINS_LIST}`;
    conexion.query(sql, async function (err, resultado) {
        if (err) throw err;
        await guardarOHLC(resultado, process.env.PERIODO, process.env.TABLE_OHLC);
        await finalizarEjecucion();
    });
    async function guardarOHLC(resultado, tiempo, variable){
        for (let i = 0; i < resultado.length; i++) {
            var coin = resultado[i].name;
            await fetch(`https://api.coingecko.com/api/v3/coins/${coin}/ohlc?vs_currency=usd&days=${tiempo}`)
            .then((res) => {
                return res.json();
            }).then((json) => {
                var ohlc = json;
                guardarBaseDeDatos(coin, ohlc, variable);
            }).catch((err) => {
                console.error(err);
            });
        }
    };
    async function guardarBaseDeDatos(coin, datos, tabla){
        for (let i = 0; i < datos.length; i++) {
            datos[i][0] = new Date(datos[i][0]);
            let month = datos[i][0].getMonth();
            let monthBD = month + 1;
            let fechaBD = datos[i][0].getFullYear() + '-' + monthBD + '-' + datos[i][0].getDate() + ' ' + datos[i][0].getHours() + ':' + datos[i][0].getMinutes() + ':' + datos[i][0].getSeconds();
            var sql = `INSERT INTO ${tabla} (
                name,
                fecha, 
                open,
                high,
                low,
                close
                )
                SELECT * FROM (SELECT
                    '${coin}' AS name,
                    '${fechaBD}' AS fecha,
                    ${datos[i][1]} AS open,
                    ${datos[i][2]} AS high,
                    ${datos[i][3]} AS low,
                    ${datos[i][4]} AS close
                ) AS tmp
                WHERE NOT EXISTS (
                    SELECT fecha, name FROM ${tabla} WHERE fecha = '${fechaBD}' AND name = '${coin}'
                ) LIMIT 1`;
            conexion.query(sql, function (err, resultado) {
                if (err) throw err;
            });
        }
    };
    async function finalizarEjecucion() {
        conexion.end();
        res.send("Ejecutado");
    }
});

app.listen(process.env.PORT || PUERTO, () => {
    console.log(`Escuchando en puerto ${process.env.PORT || PUERTO}`);
});