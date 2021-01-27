// Launch this file to use the node outside of Node-RED
const snmpTrapListener = require("./snmp-trap-listener");

// Pass null for usage outside of node red
snmpTrapListener(null, {
    port: 162,
    snmpV1: true,
    snmpV2: true,
    snmpV3: true,
    communities: [
        {
            community: "tip",
        },
        {
            community: "tap",
        },
        {
            community: "top",
        },
    ],
    users: [
        {
            name: "titi",
            authProtocol: "none",
            authKey: "",
            privProtocol: "none",
            privKey: "",
        },
        {
            name: "tata",
            authProtocol: "none",
            authKey: "",
            privProtocol: "none",
            privKey: "",
        },
        {
            name: "toto",
            authProtocol: "none",
            authKey: "",
            privProtocol: "none",
            privKey: "",
        },
    ],
    ipfilter: "",
    ipmask: "",
});
