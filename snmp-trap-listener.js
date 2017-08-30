const util              = require('util');
const snmp              = require('snmpjs');

module.exports = (RED, debugSettings) => {
    if (!RED && debugSettings) {
        // Enter debug mode | Run outside of Node-RED
        SnmpTrapListenerNode(debugSettings);
    }

    function SnmpTrapListenerNode(config) {
        if (RED)
            RED.nodes.createNode(this,config);

        let node = this;
        // Polyfills if RED is unavailable
        if (!RED) {
            node.status = options => {
                console.dir(options);
            };
            node.on = (event, cb) => {
                console.log('Bound to RED event ' + event);
                console.log('Would execute');
                console.dir(cb);
            };
            node.warn = msg => {
                console.warn(msg);
            };
        }
        let timeoutStatus;
        if (!config.port) {
            config.port = 162;
            node.warn('No port set... Setting port to 162');
        }
        node.status({fill: 'yellow', shape: 'dot', text: 'connecting'});
        const trapd = snmp.createTrapListener();

        node.on('close', function() {
            // Cleanup before node is being deleted.
            node.warn('Restarting');
            trapd.close();
        });

        trapd.on('trap', msg => {
            clearTimeout(timeoutStatus);
            node.status({fill: 'blue', shape: 'dot', text: 'ready - trapped'});
            timeoutStatus = setTimeout(() => {
                node.status({fill: 'green', shape: 'dot', text: 'ready'});
            }, 100);
            console.log('Received trap from agent', msg.pdu.agent_addr);

            if (config.community)
                if (msg.community.toString() !== config.community) {
                    console.log(`Received trap with non matching community string: Expected ${config.community} received ${msg.community.toString()}`);
                    return;
                }
            if (config.ipfilter && config.ipmask)
                if ((IPnumber(config.ipfilter) & IPmask(config.ipmask)) != IPnumber(msg.src.address)) {
                    console.log(`Received trap with wrong ip according to filter settings: ${msg.src.address}`);
                    return;
                }

            const payload = [];
            const serializedMsg = snmp.message.serializer(msg)['pdu'];

            serializedMsg.varbinds.forEach(variable => {
                payload.push(variable);
            });

            if (payload.length > 0)
                node.send({
                    payload,
                    enterprise: serializedMsg.enterprise,
                    agent_addr: serializedMsg.agent_addr,
                    generic_trap: serializedMsg.generic_trap,
                    specific_trap: serializedMsg.specific_trap,
                    time_stamp: serializedMsg.time_stamp,
                    src: msg.src,
                    version: msg.version
                });
            else
                console.log('Trap had empty payload');
        });

        trapd.bind({family: 'udp4', port: parseInt(config.port)}, () => {
            node.warn(`Success binding to port ${config.port} and listening for traps`);
            node.status({fill: 'green', shape: 'dot', text: 'ready'});
        });
    }

    function IPnumber(IPaddress) {
        let ip = IPaddress.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
        if(ip) {
            return (+ip[1]<<24) + (+ip[2]<<16) + (+ip[3]<<8) + (+ip[4]);
        }
        return null;
    }

    function IPmask(maskSize) {
        return -1<<(32-maskSize)
    }

    if (RED)
        RED.nodes.registerType("snmp-trap-listener", SnmpTrapListenerNode);
};