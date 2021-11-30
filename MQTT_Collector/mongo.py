from typing import List
from datetime import datetime
import paho.mqtt.client as mqtt
import pymongo
import pymongo.database
import pymongo.collection
import pymongo.errors
import threading
import os
import json
from flatten_json import flatten

MONGO_HOST = os.environ['MONGO_HOST']
MONGO_PORT = int(os.environ['MONGO_PORT'])
MONGO_URI = f"mongodb://{MONGO_HOST}:{MONGO_PORT}"  # mongodb://user:pass@ip:port || mongodb://ip:port
MONGO_DB = "localDB"
MONGO_COLLECTION_MEASUREMENT = "measurement"
MONGO_COLLECTION_SERIES = "serie"
MONGO_TIMEOUT = 1  # Time in seconds


class Mongo(object):
    def __init__(self):
        self.client: pymongo.MongoClient = None
        self.database: pymongo.database.Database = None
        self.collectionMeasurement: pymongo.collection.Collection = None
        self.collectionSeries: pymongo.collection.Collection = None
        self.queue: List[mqtt.MQTTMessage] = list()

    def connect(self):
        print("Connecting Mongo")
        self.client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=MONGO_TIMEOUT*1000.0)
        self.database = self.client.get_database(MONGO_DB)
        self.collectionMeasurement = self.database.get_collection(MONGO_COLLECTION_MEASUREMENT)
        self.collectionSeries = self.database.get_collection(MONGO_COLLECTION_SERIES)

    def disconnect(self):
        print("Disconnecting Mongo")
        if self.client:
            self.client.close()
            self.client = None

    def connected(self) -> bool:
        if not self.client:
            return False
        try:
            self.client.admin.command("ismaster")
        except pymongo.errors.PyMongoError:
            return False
        else:
            return True

    def _enqueue(self, msg: mqtt.MQTTMessage):
        print("Enqueuing")
        self.queue.append(msg)
        # TODO process queue

    def __store_thread_f(self, msg: mqtt.MQTTMessage):
        print("Storing")
        now = datetime.now()
        try:
            ###Check here for payload parsing of measurement
            for y, x in json.loads(msg.payload).items():
                if y == "type":
                    messageType = x
            document = {
                "topic": msg.topic,
                "payload": json.loads(msg.payload),
                "type": messageType,
                "qos": msg.qos,
                "timestamp": int(now.timestamp()),
                "datetime": now,
                # TODO datetime must be fetched right when the message is received
                # It will be wrong when a queued message is stored
            }
            result = self.collectionMeasurement.insert_one(document)
            #
            # update series list
            #
            seriesList = flatten(document['payload'], '_')
            # replace existing '.' for '-' to avoid being recognized as objects
            seriesListCleaned = {}
            # this approach is not workind, since the last series overwrites existing  series entries
            # series = []
            # for key in seriesList:
            #     # ignore meta properties, since no series
            #     if ( key != 'type' and key != 'time'):
            #         series.append(key.replace(".", "_"))
            # seriesListCleaned['type'] = document['type']
            # seriesListCleaned['series'] = series
            # print("New seriesList :", seriesListCleaned)

            for key in seriesList:
                # ignore meta properties, since no series
                if ( key != 'type' and key != 'time'):
                    seriesListCleaned[key.replace(".", "_")] = ""
            seriesListCleaned['type'] = document['type']
            seriesListCleaned['datetime'] = now
            print("New seriesList :", seriesListCleaned)

            result1 = self.collectionSeries.update_one(  { 'type': document['type']}, { "$set": seriesListCleaned } , True)

            # result1 = self.collectionSeries.update_one(  { 'type': document['type']}, { "$set": seriesListCleaned } , True)
            print("Saved in Mongo document, series:", result.inserted_id, result1)
            if not result.acknowledged:
                # Enqueue message if it was not saved properly
                self._enqueue(msg)
        except Exception as ex:
            print(ex)

    def _store(self, msg):
        th = threading.Thread(target=self.__store_thread_f, args=(msg,))
        th.daemon = True
        th.start()

    def save(self, msg: mqtt.MQTTMessage):
        print("Saving")
        if msg.retain:
            print("Skipping retained message")
            return
        if self.connected():
            self._store(msg)
        else:
            self._enqueue(msg)
