rsconf = {
    _id : "rsmongo",
    members: [
    //     {
    //         "_id": 0,
    //         "host": "mongodb1:27017",
    //         "priority": 3
    //     },
    //     {
    //         "_id": 1,
    //         "host": "mongodb2:27017",
    //         "priority": 2
    //     },
    //     {
    //         "_id": 2,
    //         "host": "mongodb3:27017",
    //         "priority": 1
    //     }
    // ]
    {
        "_id": 0,
        "host": "mongodb1:27017",
        "priority": 3
    },

]
}

rs.initiate(rsconf);

keys = { datetime: 1 };
ttl =  _getEnv('TTL_DOCUMENT')
options = { 
    expireAfterSeconds: parseInt(ttl)
}
print("Setting TTL for measurements to:", ttl)
db.measurement.createIndex(keys, options);
db.createCollection('serie')
