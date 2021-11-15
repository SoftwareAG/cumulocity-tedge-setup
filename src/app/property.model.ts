
export class CustomCertificate {
  isComplex: boolean;
  description: string;
  name: string;
  path: string;
}

export class ThinEdgeConfiguration {

  tenantUrl?: string
  deviceId?: string

/*   public constructor(
    fields?: {
      username?:string
      password?:string
      tenantUrl?: string
      deviceId?: string
    }) {
    if (fields) Object.assign(this, fields);
  }

  isConfigured():boolean {
    let result = false;
    if (this.tenantUrl && this.deviceId ) {
        result = true
    } else {
       result = false
    }
    return result
  } */
}

export class CloudConfiguration{
    username?:string
    password?:string
}

export class EdgeCMDProgress {
  status: string
  progress: number
  total: number
  cmd: string
}