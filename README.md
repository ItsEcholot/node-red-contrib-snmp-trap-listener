Node-RED SNMP Trap Listener
===========================

[![NPM](https://nodei.co/npm/node-red-contrib-snmp-trap-listener.png)](https://nodei.co/npm/node-red-contrib-snmp-trap-listener/)

This Node-RED node listen for SNMP Trap packages on the configured port.  
Trap which do meet the filter setting will emitted on the node output.

The filter option are:  
SNMP version (v1, v2c, v3)  
Community string (v1 & v2c only)  
User credential (v3 only)  
IP Filtering  

Getting Started
---------------
[Adding nodes to the palette](https://nodered.org/docs/user-guide/runtime/adding-nodes) - Node-RED Documentation  
Remember to configure the **snmp-trap-listener** node before you deploy your changes.

Documentation
-------------
### Input
The **snmp-trap-listener** node doesn't take any input.

### Output
The **snmp-trap-listener** node output object is in the following format:

SNMP v1
```json
{
	"payload":[
		{
			"oid":"1.3.6.1.4.1.13576.10.1.40.4.4.2",
			"typename":"OctetString",
			"value":[80,108,99,32,83,116,97,114,116],
			"string_value":"Plc Start"
		}
	],
	"enterprise":"1.3.6.1.4.1.13576",
	"agent_addr":"10.0.1.125",
	"generic_trap":6,
	"specific_trap":2,
	"time_stamp":8932,
	"src":{
		"family":"IPv4",
		"address":"10.0.1.125",
		"port":44688
	},
	"version":0,
	"string_version":"Trap",
	"_msgid":"e7f3490e.2320d8"
}
```

SNMP v2c/v3
```json
{
	"payload":[
		{
			"oid":"1.3.6.1.2.1.1.3.0",
			"typename":"TimeTicks",
			"value":760,
			"string_value":"760"
		},
		{
			"oid":"1.3.6.1.6.3.1.1.4.1.0",
			"typename":"OID",
			"value":"1.3.6.1.4.1.13576.0.2",
			"string_value":"1.3.6.1.4.1.13576.0.2"
		},
		{
			"oid":"1.3.6.1.4.1.13576.10.1.40.4.4.2",
			"typename":"OctetString",
			"value":[80,108,99,32,83,116,97,114,116],
			"string_value":"Plc Start"
		}
	],
	"src":{
		"family":"IPv4",
		"address":"10.0.1.125",
		"port":28391
	},
	"version":1,
	"string_version":"TrapV2",
	"_msgid":"d9562ebf.2f62d"
}
```

It's payload contains an array which contains all received variable bindings.

```javascript
{
    oid: "1.3.1",                   //OID path
    typename: "OctetString",        //Typename
    value: [Buffer],                //Contains raw data in a Buffer if String
                                    //or data if Integer
    string_value: "test_value"      //Contains data as a string
}
```

### Options
The node contains the following options:
- Port - Sets the port on which to listen for SNMP traps
- SNMP Version - Select which version of SNMP should be used.
- SNMP v1/v2c:
  - Community - Network community string. The community string acts like a user ID or password. A user with the correct community string has access to network information. The default is public.
- SNMP v3
  - Username - Username of the SNMP User-based Security Model (USM) user.
  - Authentication Protocol - Authentication protocol used to authenticate messages sent on behalf of the specified Username.
  - Authentication Key - Authentication key used by the selected authentication protocol.
  - Encryption Protocol - Encryption protocol used to encrypt messages sent on behalf of the specified Username.
  - Encryption Key - Encryption key used by the selected encryption protocol.
- IP Filter:
  - IP Address - Base IP address used for the filter.
  - Network mask - Network mask used to calculate the filter IP address range.  
   It can be in four-part dotted-decimal format: 255.255.255.0  
   or in CIDR (Classless Inter-Domain Routing) notation: 24  

  Example of IP filter:
  | IP Address | Network mask | Filter Start | Filter End |
  |---|---|---|---|
  | 192.168.1.1 | 24 | 192.168.1.1 | 192.168.1.254 |
  | 192.168.1.1 | 255.255.255.0 | 10.0.1.1 | 10.0.1.254 |
  | 10.0.1.25 | 30 | 10.0.1.25 | 10.0.1.26 |
  | 10.0.1.25 | 255.255.255.252 | 10.0.1.25 | 10.0.1.26 |

Debugging
---------
Run `node index.js` to start the listener in your debugger of choice.

Project Informations
--------------------

### - Current version:
![GitHub package.json version](https://img.shields.io/github/package-json/v/ItsEcholot/node-red-contrib-snmp-trap-listener)

### - Vulnerabilities:
![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/ItsEcholot/node-red-contrib-snmp-trap-listener)

### - Languages:
![GitHub language count](https://img.shields.io/github/languages/count/ItsEcholot/node-red-contrib-snmp-trap-listener)  
![GitHub top language](https://img.shields.io/github/languages/top/ItsEcholot/node-red-contrib-snmp-trap-listener)

### - Dependencies
![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/ItsEcholot/node-red-contrib-snmp-trap-listener/net-snmp)  
![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/ItsEcholot/node-red-contrib-snmp-trap-listener/moment)

### - License
![GitHub](https://img.shields.io/github/license/ItsEcholot/node-red-contrib-snmp-trap-listener)