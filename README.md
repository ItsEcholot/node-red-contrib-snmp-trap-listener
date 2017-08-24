Node-RED SNMP Trap Listener
===========================

[![NPM](https://nodei.co/npm/node-red-contrib-snmp-trap-listener.png)](https://nodei.co/npm/node-red-contrib-snmp-trap-listener/)

This Node-RED node will bind itself to the configured port and start listening for SNMP Trap packages
that meet the filter settings.

One can filter the received data by ip + netmask and/or by a community string.

Getting Started
---------------
Navigate to the node-red installation directory and add the package via NPM.
```
cd $HOME/.node-red
npm install node-red-contrib-snmp-trap-listener
```
Restart node-red and reload your node-red browser window for changes to take effect.
Remember to configure the snmp-trap-listener node before you deploy your changes.

Documentation
-------------
### Input
The snmp-trap-listener doesn't take any input.

### Output
The emitted payload object contains an array which contains all received variable bindings
in the following format:

```
{
    oid: "1.3.1",                   //OID path
    typename: "OctetString",        //Typename
    value: [Buffer],                //Contains raw data in a Buffer if String
                                    //or data if Integer
    string_value: "test_value"      //Contains data as a string
}
```

Sample Output
-------------
```json
[
  {
    "oid": "1.3.1.1",
    "typename": "OctetString",
    "value": {
      "type": "Buffer",
      "data": [
        116,
        101,
        115,
        116,
        86,
        97,
        108,
        117,
        101
      ]
    },
    "string_value": "testValue"
  },
  {
    "oid": "1.3.1.1",
    "typename": "Integer",
    "value": 5,
    "string_value": "5"
  }
]
```

Debugging
---------
Run index.js with node to start the listener in your debugger of choice.

Built with / Dependencies
-------------------------
- [snmpjs](https://github.com/joyent/node-snmpjs) - SNMP library