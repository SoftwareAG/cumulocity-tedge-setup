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

keys = { lastModifiedDate: -1 };
options = { 
    expireAfterSeconds: 60, 
    partialFilterExpression: { pending: true }
};
db.getCollection("tedge").createIndex(keys, options);
db.createCollection('series')
