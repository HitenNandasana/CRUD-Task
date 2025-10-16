import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { catchError, finalize, map, of, Subject, take, takeUntil } from 'rxjs';

@Component({
  selector: 'app-task-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss'
})
export class TaskFormComponent {

  private taskService = inject(TaskService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  protected id?: string;
  protected saving = false;
  protected error?: string;
  protected taskId: string | null = null;

  protected form: FormGroup = new FormGroup({
    title: new FormControl<string>('', [Validators.required]),
    description: new FormControl<string>('', [Validators.required]),
    completed: new FormControl<boolean>(false)
  })

  private destory$ = new Subject<void>();

  ngOnInit(): void {
    this.taskId = this.route.snapshot.paramMap.get('id');

    if (this.taskId) {
      this.setFormData(this.taskId);
    }
  }

  setFormData(taskId: string) {
    this.taskService.viewTask(+taskId).pipe(
      take(1),
      map(task => ({
        ...task,
        description: `This is a description for task ${taskId}`
      })
      ),
      finalize(() => this.saving = false),
      catchError((err) => {
        this.error = err;
        this.saving = false;
        return of([]);
      }),
      takeUntil(this.destory$)
    ).subscribe(
      (res) => this.form.patchValue(res)
    );
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload = this.form.value;

    if (this.taskId) {
      payload.id = this.taskId;
      this.taskService.updateTask(payload).pipe(
        take(1),
        finalize(() => this.saving = false),
        catchError((err) => {
          this.error = err;
          this.saving = false;
          return of([]);
        }),
        takeUntil(this.destory$)
      ).subscribe(
        () => this.router.navigate(['/tasks'])
      );
    } else {
      this.taskService.addTask(payload).pipe(
        take(1),
        finalize(() => this.saving = false),
        catchError((err) => {
          this.error = err;
          this.saving = false;
          return of([]);
        }),
        takeUntil(this.destory$)
      ).subscribe(
        () => this.router.navigate(['/tasks'])
      );
    }
  }

  cancel() {
    this.router.navigate(['/tasks']);
  }

  ngOnDestroy() {
    this.destory$.next();
    this.destory$.complete();
  }
}
