// Launch this file to use the node outside of Node-RED
const snmpTrapListener      = require('./snmp-trap-listener');

// Pass null for usage outside of node red
snmpTrapListener(null, {
    port: 161,
    oids: '1.3.1',
    community: ''
});