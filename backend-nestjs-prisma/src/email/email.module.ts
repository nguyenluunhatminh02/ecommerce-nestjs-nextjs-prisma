import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [forwardRef(() => QueueModule)],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
