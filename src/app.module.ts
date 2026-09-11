import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AidaModule } from './aida/aida.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { LearningPathsModule } from './learning-paths/learning-paths.module';
import { MyLearningModule } from './my-learning/my-learning.module';
import { ObservabilityModule } from './observability/observability.module';
import { TrainingLibraryModule } from './training-library/training-library.module';
import { UsersModule } from './users/users.module';

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
    AidaModule,
    AuthModule,
    MyLearningModule,
    ObservabilityModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
