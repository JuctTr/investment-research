import { Module } from '@nestjs/common';
import { UserProfileRepository } from './repositories/user-profile.repository';
import { StatusRepository } from './repositories/status.repository';

@Module({
  providers: [UserProfileRepository, StatusRepository],
  exports: [UserProfileRepository, StatusRepository],
})
export class XueqiuModule {}
