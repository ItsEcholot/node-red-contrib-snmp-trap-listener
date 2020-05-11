// Launch this file to use the node outside of Node-RED
const snmpTrapListener	= require("./snmp-trap-listener");

// Pass null for usage outside of node red
snmpTrapListener(null, {
	port: 162,
	snmpV1: true, 
	snmpV2: true,
	snmpV3: true,
	community: "",
	user_name: "",
	user_authProtocol: "",
	user_authKey: "",
	user_privProtocol: "",
	user_privKey: "",
	ipfilter: "",
	ipmask: "",
});