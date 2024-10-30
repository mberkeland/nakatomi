const { Vonage } = require('@vonage/server-sdk');
const express = require('express');
const axios = require('axios');
const fs = require("fs");

const app = express();
const port = process.env.VCR_PORT;
const server_url = process.env.VCR_INSTANCE_PUBLIC_URL;
const aiagent = process.env.aiagent;
const aikey = process.env.aikey;
const aiurl = process.env.aiurl;
var kai = [];

console.log("Starting up with URL = " + server_url);
console.log("Starting up with Agent = " + aiagent);

app.use(express.json());
app.use(express.static('public'));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "OPTIONS,GET,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    next();
});

// Create the JSON file for the WebComponent, based on YAML variables
let vars = {
    server_url: server_url,
    avatarimg: process.env.avatarimg,  // Point to the Avatar image
    title: process.env.title,  // Title on the bot
    avatarbgcolor:process.env.avatarbgcolor,  // Avatar's Background Color
    avatarmargin: process.env.avatarmargin,       // Avatar's margin
    headerbgcolor: process.env.headerbgcolor,  // Header background color
    headertitlecolor: process.env.headertitlecolor,  // Header title color
    bodybgcolor: process.env.bodybgcolor,    // Body color
    sendbuttoncolor: process.env.sendbuttoncolor,  //  Send button color
    showwait: process.env.showwait,
    agent: process.env.agent
}
console.log("Vars: ",vars);
fs.writeFileSync("public/js/vars.json", JSON.stringify(vars));

app.get('/_/health', async (req, res) => {
    res.sendStatus(200);
});
app.get('/_/metrics', async (req, res) => {
    res.sendStatus(200);
});
app.get("/keepalive", (req, res) => {
    console.log("Keepalive: " + req.query);
    res.sendStatus(200);
});
app.listen(port, () => {
    console.log(`App listening on port ${port}`)
});
app.post('/ask', async (req, res) => {
    var date = new Date().toLocaleString();
    console.log("Incoming message at " + date, req.body);
    let message = req.body.text;
    let id = req.body.id;
    if (!id) {
        return res.status(200).end();
    }
    var resp = "";
    if (!kai[id] || !kai[id].session_token) {
        kai[id] = {};
        kai[id].id = id;
        let agent = req.body.agent ? req.body.agent : aiagent;
        await startAI(id, agent);
        if (kai[id].session_id) {
            console.log("Got agent, sending Hello: ", kai[id].session_id);
            resp = await step(id, "Hello", []);
            if (message && message.length > 8) {
                resp = await step(id, message, []);
            }
        }
    } else {
        console.log("Got agent, sending message: ", message);
        resp = await step(id, message, [])
    }
    return res.status(200).json({ answer: resp });
})
async function startAI(id, agent) {
    try {
        console.log("Staring up at ", aiurl)
        const {
            data
        } = await axios.post(aiurl + 'init', { agent_id: agent },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Vgai-Key': aikey,
                }
            }
        );
        if (data && data.session_id) {
            console.log("AI Studio instance data: ", data);
            kai[id].session_id = data.session_id;
            kai[id].session_token = data.session_token;
        }
    } catch (err) {
        console.log("Error initiating Agent: ", err.response?.status, err.response?.data)
    }
}
async function step(id, input, parms = []) {
    if (!kai[id].session_id) {
        console.log("Not sending, session ended")
        return "";
    }
    var resp;
    console.log("Sending to: ", aiurl + kai[id].session_id + '/step', input, parms)
    try {

        const resp = await axios.post(aiurl + kai[id].session_id + '/step',
            { session_id: kai[id].session_id, input: input, parameters: parms },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + kai[id].session_token,
                }
            }
        );
        console.log("Got step response: ", resp.data)
        if (resp.data && (resp.data.session_status == 'ENDED')) {
            console.log("Sending quit on end of sequence ");
            kai[id].step = null;
            kai[id].session_id = null;
            kai[id].session_token = null;
        }
        if (resp.data && resp.data.messages) {
            let kmsg = "";
            resp.data.messages.forEach((msg) => {
                if (!msg.text) {
                    return;
                }
                kmsg += msg.text + ' ';
            })
            console.log("Sending back from AI: " + kmsg.substring(0, 50))
            return kmsg;
        }
    } catch (err) {
        console.log("Error stepping to Agent: ", err)
        return "";
    }
    return "";
}
