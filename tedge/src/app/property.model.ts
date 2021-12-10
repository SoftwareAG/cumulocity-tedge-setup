
export class CustomCertificate {
  isComplex: boolean;
  description: string;
  name: string;
  path: string;
}

/* export class ThinEdgeConfiguration {

  tenantUrl?: string
  deviceId?: string
  username?:string
  password?:string
  device.id=4712
  device.key.path=/etc/tedge/device-certs/tedge-private-key.pem
  device.cert.path=/etc/tedge/device-certs/tedge-certificate.pem
  c8y.url=ck2.eu-latest.cumulocity.com
  c8y.root.cert.path=/etc/ssl/certs
  az.root.cert.path=/etc/ssl/certs
  az.mapper.timestamp?: boolean
  mqtt.port?: number
  software.plugin.defaul?: string
} */

/* export class CloudConfiguration{
    username?:string
    password?:string
} */

export interface EdgeCMDProgress {
  status: string
  progress: number
  total: number
  cmd: string
}


export interface RawMeasurment {
  _id?: string
  topic?: string
  payload?: Object
  type?: string
  qos?: number
  datetime?: Date
  timestamp?: number


  // constructor( _id: string,
  //   topic: string,
  //   payload: Object,
  //   type: string,
  //   qos: number) {

  //     this._id = _id
  //     this.topic = topic
  //     this.payload = payload
  //     this.type = type
  //     this.qos = qos
  // }
}
export interface MeasurmentType {
  type: string
  series: string[]
}

export interface RawListItem {
  id: any;
  unit: string
  text: any;
  format?: string;
  isGroup?: boolean;
  groupname?: string;
}