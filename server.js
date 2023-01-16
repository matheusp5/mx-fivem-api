const { VrpProxy, VrpTunnel } = require('@vrpjs/server');

const vRP = VrpProxy.getInterface('vRP');
const vRPClient = VrpTunnel.getInterface('vRP');

const main = require("./main.json")
const apikey = "7970f3800e0e32db8d469457f9e1b9b9"

const fs = require("fs")
const imgbb = require("imgbb-uploader");
const mysql = require("mysql")
const axios = require("axios")

const express = require("express")
const app = express();
const cors = require("cors");
const bp = require("body-parser");
const { format } = require('path');

app.use(bp.urlencoded({
    extended: false
}))
app.use(bp.json())
app.use(cors())

// ---------------------------------------------------
// ------------------- SCREENSHOT --------------------
// ---------------------------------------------------

app.post("/request/img", (req, res) => {
    let id = req.body.id;
    let src = vRP.getUserSource(parseInt(id));
    if(src) {
        exports['screenshot-basic'].requestClientScreenshot(src, {}, (err, data) => {
            res.send(data)
        })
    } else {
        res.send({
            status: "failed"
        })
    }
})

// ---------------------------------------------------
// ------------------- PLAYERS ON --------------------
// ---------------------------------------------------

app.post("/request/players", (req, res) => {
    let users = []
    let players = vRP.getUsers();
    for(let x = 0; x < players.length; x++) {
        let user_id = parseInt(players[x])
        vRP.getUserIdentity(user_id).then(result => {
            users.push({ id: user_id, name: result.name})
        })
    }
    res.send(users)
})


// ---------------------------------------------------
// ------------------- GIVE BAN ----------------------
// ---------------------------------------------------

app.post("/request/ban", (req, res) => {
    let id = parseInt(req.body.id)
    let banned = false;
    //let source = vRP.getUserSource(id)
    if(req.body.banned == 1) banned = true;
    if(id) {
        vRP.setBanned(id, banned)
        res.send({
            status: "success"
        })
    } else {
        res.send({
            status: "failed"
        })
    }
    
})


// ---------------------------------------------------
// ------------------- GIVE KICK ---------------------
// ---------------------------------------------------

app.post("/request/kick", (req, res) => {
    let id = parseInt(req.body.id)
    let reason = req.body.reason;
    let source = vRP.getUserSource(id)
    if(id && reason && source) {
        vRP.kick(source, reason)
        res.send({
            status: "success"
        })
    } else {
        res.send({
            status: "failed"
        })
    }
    
})

// ---------------------------------------------------
// ------------------- GIVE MONEY --------------------
// ---------------------------------------------------

app.post("/give/money", (req, res) => {
    let amount = parseInt(req.body.amount);
    let id = parseInt(req.body.id)
    if(amount && id) {
        vRP.giveBankMoney(id, amount)
        res.send({
            status: "success"
        })
    } else {
        res.send({
            status: "failed"
        })
    }
})

// ---------------------------------------------------
// ------------------- REVIVER -----------------------
// ---------------------------------------------------

app.post("/give/god", (req, res) => {

    let id = parseInt(req.body.id)
    let source = vRP.getUserSource(id)
    if(source && id) {
        vRPClient.killGod(source)
        vRPClient.setHealth(source,400)
        TriggerClientEvent("resetBleeding",source)
        TriggerClientEvent("resetDiagnostic",source)
        res.send({
            status: "success"
        })
    } else {
        res.send({
            status: "failed"
        })
    }


})


// ---------------------------------------------------
// ------------------- GIVE CAR ----------------------
// ---------------------------------------------------

app.post("/give/car", (req, res) => {
    let id = parseInt(req.body.id)
    let vehicle = req.body.vehicle

    if(id && vehicle) {
        try{
            let conn = mysql.createConnection({
                host: "localhost",
                user: "root",
                password: ""
            })

            conn.connect();
            conn.query(`INSERT INTO vrp_user_vehicles(user_id, vehicle, detido, time, engine, body, fuel, ipva, alugado, data_alugado, estado) VALUES (${id}, "${vehicle}", 0, "0", 1000, 1000, 100, 1673492280, 0, NULL, "")`, (err, result) => {
                if(err) console.log(err)
                console.log("Result: ", result)
            })
        } catch {
            res.send({
                status: "failed"
            })
        }
    }
})


// ---------------------------------------------------
// ------------------- REMOVE CAR --------------------
// ---------------------------------------------------

app.post("/remove/car", (req, res) => {
    let id = parseInt(req.body.id)
    let vehicle = req.body.vehicle

    if(id && vehicle) {

        try {
            let conn = mysql.createConnection({
                host: "localhost",
                user: "root",
                password: ""
            })

            conn.connect();
            conn.query(`DELETE FROM vrp_user_vehicles WHERE user_id = ${id} AND vehicle = '${vehicle}'`, (err, result) => {
                if(err) res.send({ status: "failed" })
                res.send({
                    status: "success",
                    sqlresponse: result
                })
            })
        } catch {
            res.send({ status: "failed" })
        }
    } else {
        res.send({ status: "failed" })
    }
})


// ---------------------------------------------------
// ------------------- DISCORD -----------------------
// ---------------------------------------------------

//app.post("/request/server/ban", (req, res) => {
    
//})
//app.post("/request/server/kick", (req, res) => {
    
//})
//app.post("/request/server/message", (req, res) => {
    
//})


// ---------------------------------------------------
// --------------------- GET IP ----------------------
// ---------------------------------------------------

app.post("/request/ip", (req, res) => {

    let id = parseInt(req.body.id)
    let src = vRP.getUserSource(id)
    
    const ip = vRP.getPlayerEndpoint(src);

    if(ip && id && src) {
        axios.get(`http://ip-api.com/json/${ip}`).then(result => {
            if(result) {
                const response = {
                    ip: ip,
                    pais: result.country,
                    estado: `${result.regionName}, ${result.region}`,
                    cidade: result.city
                }
        
                res.send({
                    status: result.status,
                    content: response
                })
            } else {
                res.send({
                    status: "failed",
                    content: "an error ocurred"
                })
            }
        })
    }
})


// ---------------------------------------------------
// -------------- SCREENSHOT AND HOST ----------------
// ---------------------------------------------------

app.post("/request/img2", (req, res) => {
    let id = req.body.id;
    let src = vRP.getUserSource(parseInt(id));
    if(src) {
        exports['screenshot-basic'].requestClientScreenshot(src, {}, (err, data) => {

            let base = data.split("base64,");
            const base64 = base[1];

            const options = {
                apiKey: apikey,
                name: id + "-SCREENSHOT",
                base64string: base64
            };

            imgbb(options).then(result => {
                res.send({
                    status: "success",
                    content: result
                });
            }).catch(err => {
                console.log(err);
                res.send({
                    status: "failed"
                })
            })
            
        })
    } else {
        res.send({
            status: "failed"
        })
    }
})

// Start application on port 3500 (you can change the port)
app.listen(3500, () => {
    console.log("Servidor aberto e operando na porta 3500")
})
