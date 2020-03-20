import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { UserStateService } from '../../shared';
import { VglService } from '../../shared/modules/vgl/vgl.service';
import { routerTransition } from '../../router.animations';

import { Observable, combineLatest, EMPTY } from 'rxjs';
import { map, switchMap, catchError, withLatestFrom } from 'rxjs/operators';

import { Job, Solution } from '../../shared/modules/vgl/models';
import { SolutionVarBindings } from '../../shared/modules/solutions/models';
import { JobObjectComponent } from './job-object.component';
import { JobSolutionsSummaryComponent } from './job-solutions-summary.component';
import { JobDatasetsComponent } from './job-datasets.component';

@Component({
  selector: 'app-job-wizard',
  templateUrl: './job-wizard.component.html',
  styleUrls: ['./job-wizard.component.scss'],
  animations: [routerTransition()]
})
export class JobWizardComponent implements OnInit, OnDestroy {

  jobIncomplete: boolean = false;
  cancelled: boolean = false;
  noSave: boolean = false;

  solutions: Solution[];
  private _solutionsSub;

  private _routeSub;

  @ViewChild(JobObjectComponent)
  private jobObject: JobObjectComponent;

  @ViewChild(JobSolutionsSummaryComponent)
  private solutionsComponent: JobSolutionsSummaryComponent;

  @ViewChild(JobDatasetsComponent)
  private jobDatasetsComponent: JobDatasetsComponent;

  constructor(private userStateService: UserStateService,
              private vglService: VglService,
              private location: Location,
              private router: Router,
              private route: ActivatedRoute,
              private messageService: MessageService) {}

  async updateJobFromUrl(path: string ) {
    if (path === 'new') {
      // let job = this.userStateService.getJob()
      // if(job) {
      //   this.userStateService.updateJob(job);
      // } else {
      //   this.userStateService.newJob();
      // }
    } else if (path === 'job' && this.route.snapshot.params.id) {
      // Load the specified job from the server
      const id = parseInt(this.route.snapshot.params.id, 10);
      let job = await this.userStateService.loadJob(id).toPromise();
      this.jobDatasetsComponent.loadJobInputs();

      this.messageService.add({
        severity: 'success',
        summary: 'Load success',
        detail: `Job ${job.id} loaded successfully.`
      });
    }
  }

  ngOnInit() {
    // Check the URL and parameters to determine whether we're creating a new
    // job or loading an existing one.

    this._routeSub = this.route.url.subscribe( 
      parts => this.updateJobFromUrl(parts[0].path) 
    )
    
    this._solutionsSub = this.userStateService.selectedSolutions.subscribe(
      solutions => this.solutions = solutions
    );
  }

  ngOnDestroy() {
    // Clean up subs
    this._solutionsSub.unsubscribe();
    this._routeSub.unsubscribe();
  }

  async save() {
    this.noSave = true;
    this.messageService.clear();
    this.messageService.add({severity: 'info', summary: 'Saving job...', detail: '', sticky: true});
    let error= 'Unknown error in save()';

    //const oldId = this.getJobObject().id;
    try {
      let resp = await this.doSave()
      if (resp) {
        const id = resp.id;
        this.messageService.clear();
        this.messageService.add({severity: 'success', summary: 'Saved', detail: `Job ${id} saved successfully.`});
        this.noSave = false;
        return this.router.navigate(['/wizard/job', id]);
      }
    } catch(err) {
      error = JSON.stringify(err)
    }
    this.messageService.clear();
    this.messageService.add({severity: 'error', summary: 'Save failed!', detail: error, sticky: true});
    this.noSave = false;
    return EMPTY;
  }

  async submit() {
    this.noSave = true;
    this.messageService.clear();
    this.messageService.add({severity: 'info', summary: 'Submitting job...', detail: '', sticky: true});

    try {
      let savedJob = await this.doSave();
      await this.vglService.submitJob(savedJob);
      this.messageService.add({
        severity: 'success',
        summary: 'Submitted',
        detail: `Job ${savedJob.id} submitted successfully.`,
        life: 10000
      });
      this.router.navigate(['/jobs']);
    } catch(error) {
      console.log('Failed to submit job: ' + error);
      this.noSave = false;
    }
  }

  private doSave(): Promise<Job> {
    // Save the job to the backend
    return this.vglService.saveJob(this.getJobObject(),
                                   this.userStateService.getJobDownloads(),
                                   this.userStateService.getJobTemplateWithVars(),
                                   this.userStateService.getSolutionsCart(),
                                   this.userStateService.getUploadedFiles());
  }

  cancel() {
    this.location.back();
  }

  getJobObject(): Job {
    return this.jobObject.getJobObject();
  }

  isJobComplete(): boolean {
    if (this.solutions.length > 0 && this.validSolutionBindings() && this.jobObject.form.valid) {
      this.jobIncomplete = false;
    } else {
      this.jobIncomplete = true;
    }
    return this.jobIncomplete;
  }

  validSolutionBindings(): boolean {
    const solutionvarBindings: SolutionVarBindings = this.userStateService.getSolutionBindings();
    for (let solution of this.solutions) {
      for (const bindings of solutionvarBindings[solution.id]) {
        if (bindings.required && !bindings.value) {
          return false;
        }
      }
    }
    return true;
  }
}
