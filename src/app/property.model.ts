
export class CustomCertificate {
  isComplex: boolean;
  description: string;
  name: string;
  path: string;
}

export class TenantInfo {
  username:string
  password:string
  tenantId:string
  tenantUrl: string
}

export class EdgeCMDProgress {
  status: string
  progress: number
  total: number
  cmd: string
}