import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  AuthResponseDto,
} from "../dtos/auth.dto";
import { AuthService } from "../services/auth.service";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(forgotPasswordDto.email);
  }

  async resetPassword(
    token: string,
    resetPasswordDto: ResetPasswordDto
  ): Promise<void> {
    await this.authService.resetPassword(token, resetPasswordDto.password);
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void> {
    await this.authService.verifyEmail(verifyEmailDto.token);
  }

  async refreshToken(token: string): Promise<AuthResponseDto> {
    return this.authService.refreshToken(token);
  }
}
