import { ConfigService } from "@nestjs/config";
import { JwtModuleOptions } from "@nestjs/jwt";

export async function getJwtInviteConfig(
  configService: ConfigService
): Promise<JwtModuleOptions> {
  return {
    secret: configService.getOrThrow<string>("JWT_SECRET_INVITE_KEY"),
    signOptions: {
      algorithm: "HS256",
    },
    verifyOptions: {
      algorithms: ["HS256"],
      ignoreExpiration: false,
    },
  };
}