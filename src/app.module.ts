import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { LearningPathsModule } from './learning-paths/learning-paths.module';
import { TrainingLibraryModule } from './training-library/training-library.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    DatabaseModule,
    LearningPathsModule,
    TrainingLibraryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
