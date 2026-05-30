export type ContractStatus = 'draft' | 'sent' | 'signed' | 'expired';

export interface Contract {
  id: string;
  driverId?: string;
  driverSurname: string;
  driverGivenName: string;
  driverAddress: string;
  driverEmail: string;
  driverPhone: string;
  driverLicense: string;
  driverLicenseExpiry: string;
  carRego: string;
  carModel: string;
  carYear: number;
  weeklyRent: number;
  minimumDuration: number;
  insurancePolicyNumber: string;
  startDate: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorEmail: string;
  ownerName: string;
  ownerAddress: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerCompany: string;
  status: ContractStatus;
  signingToken: string;
  signedAt?: string;
  signatureDataUrl?: string;
  signatureIp?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContractFormData = Omit<Contract,
  'id' | 'status' | 'signingToken' | 'signedAt' | 'signatureDataUrl' | 'signatureIp' | 'createdAt' | 'updatedAt'
>;
