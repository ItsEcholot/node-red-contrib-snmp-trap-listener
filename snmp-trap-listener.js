const util = require("util");
const snmp = require("net-snmp");
const moment = require("moment");
const logTimeFormat = "D MMM HH:mm:ss - [[log]] ";

module.exports = (RED, debugSettings) => {
    function nodeStatus(
        node,
        timeoutStatus,
        fill,
        shape,
        text,
        nextFill,
        nextShape,
        nextMessage,
    ) {
        clearTimeout(timeoutStatus);
        node.status({ fill, shape, text });
        timeoutStatus = setTimeout(() => {
            node.status({ nextFill, nextShape, nextMessage });
        }, 1000);
    }
    // Function to filter IP address (>>> 0 is to keep data as unsigned32)
    function checkIpFilter(ipfilter, ipmask, ipaddress) {
        let _ipfilter = ipfilter.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
        let _ipaddress = ipaddress.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
        let _ipmask = ipmask.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
        if (_ipmask) {
            _ipmask =
                ((+_ipmask[1] << 24) +
                    (+_ipmask[2] << 16) +
                    (+_ipmask[3] << 8) +
                    +_ipmask[4]) >>>
                0;
        } else {
            _ipmask = (-1 << (32 - parseInt(ipmask, 10))) >>> 0;
        }
        if (_ipfilter && ipmask && _ipaddress) {
            _ipfilter =
                ((+_ipfilter[1] << 24) +
                    (+_ipfilter[2] << 16) +
                    (+_ipfilter[3] << 8) +
                    +_ipfilter[4]) >>>
                0;

            let _ipfiltermin;
            let _ipfiltermax;

            if (_ipmask === (Math.pow(2, 32) - 1) >>> 0) {
                // Netmask 32 is only 1 address
                _ipfiltermin = _ipfilter >>> 0;
                _ipfiltermax = _ipfilter >>> 0;
            } else if (_ipmask === (Math.pow(2, 32) - 2) >>> 0) {
                // Netmask 32 is only 2 address (normal calculation with min/max reversed
                _ipfiltermin = ((_ipfilter | ~_ipmask) - 1) >>> 0;
                _ipfiltermax = ((_ipfilter & _ipmask) + 1) >>> 0;
            } else {
                _ipfiltermin = ((_ipfilter & _ipmask) + 1) >>> 0;
                _ipfiltermax = ((_ipfilter | ~_ipmask) - 1) >>> 0;
            }
            _ipaddress =
                ((+_ipaddress[1] << 24) +
                    (+_ipaddress[2] << 16) +
                    (+_ipaddress[3] << 8) +
                    +_ipaddress[4]) >>>
                0;
            if (_ipfiltermin <= _ipaddress && _ipaddress <= _ipfiltermax) {
                return true;
            } else {
                return false;
            }
        }
        return false;
    }

    function snmpTrapListener(config) {
        if (RED) {
            RED.nodes.createNode(this, config);
        }

        this.receiver = null;

        let node = this;

        // Polyfills if RED is unavailable
        if (!RED) {
            node.debug = (msg) => {
                // eslint-disable-next-line no-console
                console.debug(moment().format(logTimeFormat) + msg);
            };
            node.log = (msg) => {
                // eslint-disable-next-line no-console
                console.log(moment().format(logTimeFormat) + msg);
            };
            node.warn = (msg) => {
                // eslint-disable-next-line no-console
                console.warn(moment().format(logTimeFormat) + msg);
            };
            node.error = (msg) => {
                // eslint-disable-next-line no-console
                console.error(moment().format(logTimeFormat) + msg);
            };
            node.send = (payload) => {
                node.log("Would send: " + JSON.stringify(payload));
            };
            node.status = (options) => {
                node.log("Debug options: " + JSON.stringify(options));
                // console.log(moment().format(logTimeFormat) + "Debug options:");
                // console.dir(options);
            };
            node.on = (event, cb) => {
                node.log("Bound to RED event: " + event);
                // console.log(moment().format(logTimeFormat) + "Bound to RED event " + event);
                node.log("Would execute: " + cb);
                // console.log(moment().format(logTimeFormat) + "Would execute");
                // console.dir(cb);
            };
        }

        // Add a timeout to reset the status to green after x time (ms)
        let timeoutStatus;

        if (!config.port) {
            config.port = 162;
            node.warn("No port set... Setting port to 162");
            // console.warn(moment().format(logTimeFormat) + "No port set... Setting port to 162");
        }

        if (config.snmpV1 === null || typeof config.snmpV1 === "undefined") {
            config.snmpV1 = true;
        }
        if (config.snmpV2 === null || typeof config.snmpV2 === "undefined") {
            config.snmpV2 = true;
        }
        if (config.snmpV3 === null || typeof config.snmpV3 === "undefined") {
            config.snmpV3 = true;
        }

        node.status({ fill: "yellow", shape: "ring", text: "connecting" });

        // Default options
        var options = {
            port: parseInt(config.port, 10),
            disableAuthorization: !config.communities && !config.users,
            engineID: "8000B98380XXXXXXXXXXXX", // where the X's are random hex digits
            transport: "udp4",
        };

        var callback = function (error, trap) {
            if (error) {
                node.debug("Oops: " + JSON.stringify(error));
                if (error.name === "RequestFailedError") {
                    nodeStatus(
                        node,
                        timeoutStatus,
                        "red",
                        "dot",
                        "error - not trapped",
                        "green",
                        "dot",
                        "ready",
                    );
                    // clearTimeout(timeoutStatus);
                    // node.status({fill: "red", shape: "dot", text: "error - not trapped"});
                    // timeoutStatus = setTimeout(() => {
                    //     node.status({fill: "green", shape: "dot", text: "ready"});
                    // }, 1000);
                    node.log("Received invalid trap: " + error.message);
                    // console.log(moment().format(logTimeFormat) + "Received invalid trap: ", error.message);
                } else if (error.errno === "EACCES") {
                    node.error("can't open port: " + error.port);
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "error - port unavailable",
                    });
                } else {
                    node.log("Error message: " + error.message);
                    // console.log(moment().format(logTimeFormat) + "Error: ", error);
                }
            } else {
                node.debug("Received: " + JSON.stringify(trap));

                let trapType = snmp.PduType[trap.pdu.type] || "Unknown";

                if (
                    (trap.pdu.type === snmp.PduType.Trap && config.snmpV1) ||
                    (trap.pdu.type === snmp.PduType.TrapV2 &&
                        (config.snmpV2 || config.snmpV3)) ||
                    (trap.pdu.type === snmp.PduType.InformRequest &&
                        (config.snmpV2 || config.snmpV3))
                ) {
                    nodeStatus(
                        node,
                        timeoutStatus,
                        "blue",
                        "dot",
                        "ready - trapped",
                        "green",
                        "dot",
                        "ready",
                    );
                    // clearTimeout(timeoutStatus);
                    // node.status({fill: "blue", shape: "dot", text: "ready - trapped"});
                    // timeoutStatus = setTimeout(() => {
                    //     node.status({fill: "green", shape: "dot", text: "ready"});
                    // }, 1000);
                    // console.log(moment().format(logTimeFormat) + "Received trap from agent", trap.rinfo.address);
                    if (
                        !config.ipfilter ||
                        !config.ipmask ||
                        checkIpFilter(
                            config.ipfilter,
                            config.ipmask,
                            trap.rinfo.address,
                        )
                    ) {
                        let payload = [];
                        trap.pdu.varbinds.forEach((variable) => {
                            payload.push({
                                oid: variable.oid,
                                typename: snmp.ObjectType[variable.type],
                                value: variable.value,
                                // eslint-disable-next-line camelcase
                                string_value: variable.value.toString(),
                            });
                        });
                        if (trap.pdu.type === snmp.PduType.Trap) {
                            node.log(
                                "Received " +
                                    trapType +
                                    " from " +
                                    trap.rinfo.address +
                                    ": " +
                                    trap.pdu.enterprise,
                            );
                            // console.log (now + ": " + trapType + ": " + trap.rinfo.address + " : " + trap.pdu.enterprise);
                            node.send({
                                payload,
                                enterprise: trap.pdu.enterprise,
                                // eslint-disable-next-line camelcase
                                agent_addr: trap.pdu.agentAddr,
                                // eslint-disable-next-line camelcase
                                generic_trap: trap.pdu.generic,
                                // eslint-disable-next-line camelcase
                                specific_trap: trap.pdu.specific,
                                // eslint-disable-next-line camelcase
                                time_stamp: trap.pdu.upTime,
                                src: {
                                    family: trap.rinfo.family,
                                    address: trap.rinfo.address,
                                    port: trap.rinfo.port,
                                },
                                version: 0,
                                // eslint-disable-next-line camelcase
                                string_version: trapType,
                                _msgid: trap._msgid,
                            });
                        } else {
                            node.log(
                                "Received " +
                                    trapType +
                                    " from " +
                                    trap.rinfo.address +
                                    ": " +
                                    trap.pdu.varbinds[1].value,
                            );
                            // console.log (now + ": " + trapType + ": " + trap.rinfo.address + " : " + trap.pdu.varbinds[1].value);
                            node.send({
                                payload,
                                src: {
                                    family: trap.rinfo.family,
                                    address: trap.rinfo.address,
                                    port: trap.rinfo.port,
                                },
                                version: 1,
                                // eslint-disable-next-line camelcase
                                string_version: trapType,
                                _msgid: trap._msgid,
                            });
                        }
                    } else {
                        nodeStatus(
                            node,
                            timeoutStatus,
                            "yellow",
                            "dot",
                            "warning - filtered",
                            "green",
                            "dot",
                            "ready",
                        );
                        // clearTimeout(timeoutStatus);
                        // node.status({fill: "red", shape: "dot", text: "error - filtered"});
                        // timeoutStatus = setTimeout(() => {
                        //     node.status({fill: "green", shape: "dot", text: "ready"});
                        // }, 1000);
                        node.log(
                            "Received trap with wrong ip according to filter settings: " +
                                config.ipfilter +
                                "/" +
                                config.ipmask,
                        );
                        // console.log(moment().format(logTimeFormat) + `Received trap with wrong ip according to filter settings: ${trap.rinfo.address}`);
                    }
                } else {
                    node.log(
                        "Received " + trapType + " from " + trap.rinfo.address,
                    );
                }
            }
        };

        node.receiver = snmp.createReceiver(options, callback);
        node.log("Listening for traps on port: " + config.port);
        let authorizer = node.receiver.getAuthorizer();
        if (config.snmpV1 || config.snmpV2) {
            let communities = config.communities || [];

            communities.forEach((communitie) => {
                let community = communitie.community;
                if (community !== "") {
                    node.log("Adding Community: " + community);
                    authorizer.addCommunity(community);
                } else {
                    node.warn("Invalid empty community found");
                }
            });
        }
        if (config.snmpV3) {
            let users = config.users || [];
            users.forEach((user) => {
                if (
                    user.name !== "" &&
                    (user.authProtocol === "none" || user.authKey !== "") &&
                    (user.privProtocol === "none" || user.privKey !== "")
                ) {
                    let userLevel;
                    if (user.authProtocol === "none") {
                        userLevel = snmp.SecurityLevel.noAuthNoPriv;
                    } else if (user.privProtocol === "none") {
                        userLevel = snmp.SecurityLevel.authNoPriv;
                    } else {
                        userLevel = snmp.SecurityLevel.authPriv;
                    }
                    let userAuthProtocol;
                    switch (user.authProtocol) {
                        case "md5":
                            userAuthProtocol = snmp.AuthProtocols.md5;
                            break;
                        case "sha":
                            userAuthProtocol = snmp.AuthProtocols.sha;
                            break;
                        default:
                            userAuthProtocol = snmp.AuthProtocols.md5;
                            break;
                    }
                    let userPrivProtocol;
                    switch (user.privProtocol) {
                        case "des":
                            userPrivProtocol = snmp.PrivProtocols.des;
                            break;
                        case "aes":
                            userPrivProtocol = snmp.PrivProtocols.aes;
                            break;
                        default:
                            userPrivProtocol = snmp.PrivProtocols.des;
                            break;
                    }
                    let User = {
                        name: user.name,
                        level: userLevel,
                        authProtocol: userAuthProtocol,
                        authKey: user.authKey,
                        privProtocol: userPrivProtocol,
                        privKey: user.privKey,
                    };
                    node.log("Adding User: " + JSON.stringify(User));
                    authorizer.addUser(User);
                } else {
                    node.warn(
                        "Invalid user:\n\tname = " +
                            user.name +
                            "\n\tauthProtocol = " +
                            user.authProtocol +
                            "\n\tauthKey = " +
                            user.authKey +
                            "\n\tprivProtocol = " +
                            user.privProtocol +
                            "\n\tprivKey = " +
                            user.privKey,
                    );
                }
            });
        }
        node.status({ fill: "green", shape: "dot", text: "ready" });

        node.on("close", function () {
            // Cleanup before node is being deleted.
            node.log("Closing port: " + config.port);
            node.status({ fill: "gray", shape: "ring", text: "offline" });
            node.receiver.close();
        });
    }

    if (!RED && debugSettings) {
        // Enter debug mode | Run outside of Node-RED
        snmpTrapListener(debugSettings);
    }

    if (RED) {
        RED.nodes.registerType("snmp-trap-listener", snmpTrapListener);
    }
};
