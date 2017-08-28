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
            config.port = 161;
            node.warn('No port set... Setting port to 161');
        }
        node.status({fill: 'yellow', shape: 'dot', text: 'connecting'});
        const trapd = snmp.createTrapListener();

        node.on('close', function() {
            // Cleanup before node is being deleted.
            node.warn('Restarting');
            trapd.close();
        });

        // console.dir(config);
        trapd.on('trap', msg => {
            clearTimeout(timeoutStatus);
            node.status({fill: 'blue', shape: 'dot', text: 'ready - trapped'});
            timeoutStatus = setTimeout(() => {
                node.status({fill: 'green', shape: 'dot', text: 'ready'});
            }, 50);

            if (config.community)
                if (msg.community.toString() !== config.community) {
                    node.warn('Received trap with wrong community string');
                    return;
                }
            if (config.ipfilter && config.ipmask)
                if ((IPnumber(config.ipfilter) & IPmask(config.ipmask)) != IPnumber(msg._src.address)) {
                    node.warn('Received trap with wrong ip according to filter settings');
                    return;
                }

            const payload = [];
            const serializedMsg = snmp.message.serializer(msg)['pdu'];

            serializedMsg.varbinds.forEach(variable => {
                const oids = config.oids.split('\n');

                if (config.oids && oids.indexOf(variable.oid) !== -1) {
                    payload.push(variable);
                }
                else {
                    payload.push(variable);
                }
            });

            if (payload.length > 0)
                node.send({payload});
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