interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  businessType: string;
}

interface LoginDto {
  email: string;
  password: string;
}

interface ForgotPasswordDto {
  email: string;
}

interface ResetPasswordDto {
  password: string;
}

interface VerifyEmailDto {
  token: string;
}

// Response DTOs
interface UserResponseDto {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  teamId: string;
  lastLogin: Date;
}

interface TeamResponseDto {
  _id: string;
  name: string;
  businessType: string;
  contact: {
    email: string;
  };
  subscription: {
    plan: string;
    status: string;
    expiresAt: Date;
  };
  isActive: boolean;
  ownerId: string;
}

interface AuthResponseDto {
  user: UserResponseDto;
  team: TeamResponseDto;
  token: string;
}

export {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  UserResponseDto,
  TeamResponseDto,
  AuthResponseDto,
};
