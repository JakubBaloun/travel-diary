import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import { TripsModule } from './trips/trips.module';
import { DaysModule } from './days/days.module';
import { EntriesModule } from './entries/entries.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.user'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    TripsModule,
    DaysModule,
    EntriesModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [TripsModule],
})
export class AppModule {}
