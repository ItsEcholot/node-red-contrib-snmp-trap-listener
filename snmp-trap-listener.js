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

        if (!config.port)
            config.port = 161;

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
        }
        let timeoutStatus;
        node.status({fill: 'yellow', shape: 'dot', text: 'connecting'});
        const trapd = snmp.createTrapListener();

        node.on('close', function() {
            // Cleanup before node is being deleted.
            trapd.close();
        });

        // console.dir(config);
        trapd.on('trap', msg => {
            clearTimeout(timeoutStatus);
            node.status({fill: 'blue', shape: 'dot', text: 'ready - trapped'});
            timeoutStatus = setTimeout(() => {
                node.status({fill: 'green', shape: 'dot', text: 'ready'});
            }, 50);

            const payload = [];
            const serializedMsg = snmp.message.serializer(msg)['pdu'];

            serializedMsg.varbinds.forEach(variable => {
                const oids = config.oids.split('\n');

                if (oids.indexOf(variable.oid) !== -1) {
                    payload.push(variable);
                }
            });

            if (payload.length > 0)
                node.send({payload});
        });

        trapd.bind({family: 'udp4', port: parseInt(config.port)}, () => {
            node.status({fill: 'green', shape: 'dot', text: 'ready'});
        });
    }

    if (RED)
        RED.nodes.registerType("snmp-trap-listener", SnmpTrapListenerNode);
};