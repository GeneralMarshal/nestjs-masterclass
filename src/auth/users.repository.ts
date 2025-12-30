import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';

export class TasksRepository {
  constructor(
    @InjectRepository(User)
    private taskRepository: Repository<User>,
  ) {}
}
