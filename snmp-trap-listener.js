module.exports = (RED, debugSettings) => {
    if (!RED && debugSettings) {
        // Enter debug mode | Run outside of Node-RED
    }

    function SnmpTrapListenerNode(config) {
        RED.nodes.createNode(this,config);
        let node = this;

        node.on('close', done => {
            // Cleanup before node is being deleted. Call done when finished.
            done();
        });

        node.send({payload: 'Test'});
        node.status({fill: 'green', shape: 'dot', text: 'ready'});
    }

    if (RED)
        RED.nodes.registerType("snmp-trap-listener", SnmpTrapListenerNode);
};