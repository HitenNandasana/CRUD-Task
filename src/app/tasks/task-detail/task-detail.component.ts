import { Component, inject } from '@angular/core';
import { Task } from '../../core/interface/task.interface';
import { TaskService } from '../../core/services/task.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, finalize, map, of, Subject, take, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-detail',
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss'
})

export class TaskDetailComponent {

  private taskService = inject(TaskService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  protected loading = true;
  protected task: Task | null = null;
  protected error?: string;

  private destory$ = new Subject<void>();

  ngOnInit() {
    const taskId = this.route.snapshot.paramMap.get('id');
    if (taskId) {
      this.taskService.viewTask(+taskId).pipe(
        take(1),
        map(task => ({
            ...task,
            description: `This is a description for task ${taskId}`
          })
        ),
        finalize(() => this.loading = false),
        catchError((err) => {
          this.error = err;
          this.loading = false;
          return of(null);
        }),
        takeUntil(this.destory$)
      ).subscribe(
        (res) => this.task = res
      );
    }
  }

  editTask(task: Task) {
    this.router.navigate(['/tasks', task.id, 'edit']);
  }

  backToList() {
    this.router.navigate(['/tasks']);
  }

  ngOnDestroy() {
    this.destory$.next();
    this.destory$.complete();
  }
}
