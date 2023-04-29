require('dotenv').config();
const fetch = require('node-fetch');
const connectToDatabase = require("./database");

exports.handler = async function (event) {
    try {
        const { Coins, OHLC, Op } = await connectToDatabase().catch((error) => {
            throw error;
        });
        var coins = await Coins.findAll({
            attributes: ["name"]
        });
        var coinNames = coins.map((coin) => coin.name);
        var grupo = Math.floor(coinNames.length/process.env.NUM_GRUPOS);
        var contador = grupo;
        var cantGrupos = [contador];
        while (contador < coinNames.length) {
            contador = contador + grupo;
            cantGrupos.push(contador);
        }
        if (contador > coinNames.length) {
            cantGrupos.pop();
            cantGrupos.push(coinNames.length);
        }
        console.log(cantGrupos);
        var inicio = 0;
        for (let i = 0; i < cantGrupos.length; i++) {
            const fin = cantGrupos[i];
            console.log(`Inicio: ${inicio}, Final: ${fin}`)
            console.log(`Entre ${i+1} veces`);
            await guardarOHLC(coinNames, inicio, fin, OHLC);
            if (i+1 < cantGrupos.length) {
                await delay(process.env.DELAY);
            }
            inicio = fin;
        }
        if (inicio == coinNames.length) {
            return {
                statusCode: 200,
                body: "Ejecutado"
            };
        }
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: `Se presentó un error: ${error}`
        }
    }
    async function delay(ms) {
        return await new Promise(resolve => setTimeout(resolve, ms));
    }
    async function guardarOHLC(resultado, inicio, fin, OHLC){
        const nuevoArray = [];
        for (let i = inicio; i < fin; i++) {
            var coin = resultado[i];
            await fetch(`https://api.coingecko.com/api/v3/coins/${coin}/ohlc?vs_currency=usd&days=${process.env.PERIODO}`)
            .then((res) => {
                return res.json();
            }).then(async (json) => {
                var ohlc = json;
                configurarDatos(coin, ohlc, nuevoArray);
            }).catch((err) => {
                console.log(err);
            });
        }
        await guardarBaseDatos(nuevoArray, OHLC);
    };
    function configurarDatos(coin, datos, nuevoArray) {
        for (let i = 0; i < datos.length; i++) {
            datos[i][0] = new Date(datos[i][0]);
            let month = datos[i][0].getMonth();
            let monthBD = month + 1;
            let fechaBD = datos[i][0].getFullYear() + '-' + monthBD + '-' + datos[i][0].getDate() + ' ' + datos[i][0].getHours() + ':' + datos[i][0].getMinutes() + ':' + datos[i][0].getSeconds();
            
            nuevoArray.push({
                name: coin,
                fecha: fechaBD,
                open: parseFloat(datos[i][1]).toFixed(6),
                high: parseFloat(datos[i][2]).toFixed(6),
                low: parseFloat(datos[i][3]).toFixed(6),
                close: parseFloat(datos[i][4]).toFixed(6)
            });
        }
        return nuevoArray;
    };
    async function guardarBaseDatos(data, OHLC) {
        try {
            const ohlcs = await OHLC.bulkCreate(
                data.map((value) => ({
                    name: value.name,
                    fecha: value.fecha,
                    open: value.open,
                    high: value.high,
                    low: value.low,
                    close: value.close
                })),
                {
                    fields: ["name", "fecha", "open", "high", "low", "close"],
                    ignoreDuplicates: true
                }
            ).then(() => {
                console.log("Registros creados exitosamente");
            })
            .catch((error) => {
                console.log("Ocurrio un error al crear los registros: ", error)
            });
        } catch (error) {
            console.log(error);
        }
    }
};