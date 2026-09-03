export interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface IVerifyEmailPayload {
  email: string;
  otp: string;
}
