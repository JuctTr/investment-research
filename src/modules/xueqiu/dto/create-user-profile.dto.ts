import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateXueqiuUserProfileDto {
  @IsString()
  uid: string;

  @IsString()
  screenName: string;

  @IsNumber()
  followersCount: number;

  @IsNumber()
  friendsCount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  rawData?: Record<string, any>;
}
