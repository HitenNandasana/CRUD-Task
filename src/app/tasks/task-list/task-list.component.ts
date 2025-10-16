import { Component, inject } from '@angular/core';
import { Task } from '../../core/interface/task.interface';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, finalize, map, of, Subject, take, takeUntil } from 'rxjs';
import { TaskService } from '../../core/services/task.service';

@Component({
  selector: 'app-task-list',
  imports: [
    CommonModule,
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent {

  private router = inject(Router);
  private taskService = inject(TaskService);

  protected tasks: Task[] = [];
  protected loading = false;
  protected error?: string;
  private destory$ = new Subject<void>();

  ngOnInit() {
    this.loading = true;
    this.getAllTaskList();
  }

  getAllTaskList() {
    this.taskService.getAllTasks().pipe(
      take(1),
      map(tasks =>
        tasks.slice(0, 15).map(task => ({
          ...task,
          description: `This is a description for task ${task.id}`
        }))
      ),
      finalize(() => this.loading = false),
      catchError((err) => {
        this.error = err;
        this.loading = false;
        return of([]);
      }),
      takeUntil(this.destory$)
    ).subscribe(
      res => this.tasks = res
    );
  }

  add() {
    this.router.navigate(['/tasks/add']);
  }

  edit(task: Task) {
    this.router.navigate(['/tasks', task.id, 'edit']);
  }

  view(task: Task) {
    this.router.navigate(['/tasks', task.id]);
  }

  deleteTask(task: Task) {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return;
    this.taskService.deleteTask(task.id).pipe(
      take(1),
      finalize(() => this.loading = false),
      catchError((err) => {
        this.error = err;
        this.loading = false;
        return of([]);
      }),
      takeUntil(this.destory$)
    ).subscribe(
      () => {
        this.tasks = this.tasks.filter(t => t.id !== task.id);
      }
    )
  }

  ngOnDestroy() {
    this.destory$.next();
    this.destory$.complete();
  }
}
