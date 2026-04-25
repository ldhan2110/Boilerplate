import { Module } from '@nestjs/common';
import { CompaniesModule } from './companies/companies.module';
import { UsersModule } from './users/users.module';
import { ProgramsModule } from './programs/programs.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [CompaniesModule, UsersModule, ProgramsModule, RolesModule],
  exports: [CompaniesModule, UsersModule, ProgramsModule, RolesModule],
})
export class AdministrationModule {}
