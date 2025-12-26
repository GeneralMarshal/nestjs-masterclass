import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import type { Task, TaskStatus } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-task-filter.dto';
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  getTasks(@Query() filtersDto: GetTasksFilterDto): Task[] {
    // if we have any filters defined, call getTaskWithFilters
    // otherwise get all tasks
    if (Object.keys(filtersDto).length > 0) {
      return this.tasksService.getTaskWithFilters(filtersDto);
    } else {
      return this.tasksService.getAllTasks();
    }
  }

  @Post()
  createTask(@Body() createTaskDto: CreateTaskDto): Task {
    return this.tasksService.createTask(createTaskDto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.tasksService.getTaskById(id);
  }

  @Delete(':id')
  removeTask(@Param('id') id: string) {
    return this.tasksService.removeTask(id);
  }

  @Patch(':id/status')
  updateTaskStatus(
    @Param('id') id: string,
    @Body('status') status: TaskStatus,
  ) {
    return this.tasksService.updateTaskStatus(id, status);
  }
}
