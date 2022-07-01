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
    async function delay(ms) {
        return await new Promise(resolve => setTimeout(resolve, ms));
      }
    conexion.query(sql, async function (err, resultado) {
        if (err) throw err;
        var grupo = Math.floor(resultado.length/process.env.NUM_GRUPOS);
        var contador = grupo;
        var cantGrupos = [contador];
        while (contador < resultado.length) {
            contador = contador + grupo;
            cantGrupos.push(contador);
        }
        if (contador > resultado.length) {
            cantGrupos.pop();
            cantGrupos.push(resultado.length);
        }
        var inicio = 0;
        for (let i = 0; i < cantGrupos.length; i++) {
            const fin = cantGrupos[i];
            console.log(`Entre ${i+1} veces`);
            await delay(process.env.DELAY);
            guardarOHLC(resultado, inicio, fin);
            inicio = fin;
        }
        if (inicio == resultado.length) {
            finalizarEjecucion();
        }
    });
    async function guardarOHLC(resultado, inicio, fin){
        for (let i = inicio; i < fin; i++) {
            var coin = resultado[i].name;
            await fetch(`https://api.coingecko.com/api/v3/coins/${coin}/ohlc?vs_currency=usd&days=${process.env.PERIODO}`)
            .then((res) => {
                return res.json();
            }).then((json) => {
                var ohlc = json;
                guardarBaseDeDatos(coin, ohlc);
            }).catch((err) => {
                console.error(err);
            });
        }
    };
    async function guardarBaseDeDatos(coin, datos){
        for (let i = 0; i < datos.length; i++) {
            datos[i][0] = new Date(datos[i][0]);
            let month = datos[i][0].getMonth();
            let monthBD = month + 1;
            let fechaBD = datos[i][0].getFullYear() + '-' + monthBD + '-' + datos[i][0].getDate() + ' ' + datos[i][0].getHours() + ':' + datos[i][0].getMinutes() + ':' + datos[i][0].getSeconds();
            var sql = `INSERT INTO ${process.env.TABLE_OHLC} (
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
                    SELECT fecha, name FROM ${process.env.TABLE_OHLC} WHERE fecha = '${fechaBD}' AND name = '${coin}'
                ) LIMIT 1`;
            conexion.query(sql, function (err, resultado) {
                if (err) throw err;
            });
        }
    };
    async function finalizarEjecucion() {
        res.send("Ejecutado");
    }
});

app.listen(process.env.PORT || PUERTO, () => {
    console.log(`Escuchando en puerto ${process.env.PORT || PUERTO}`);
});