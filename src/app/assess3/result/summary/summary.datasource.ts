import { DataSource } from '@angular/cdk/table';
import { CollectionViewer } from '@angular/cdk/collections';

import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { AssessService } from '../../services/assess.service';
import { Dictionary } from '../../../models/json/dictionary';
import { environment } from '../../../../environments/environment';
import { LastModifiedAssessment3 } from '../../models/last-modified-assessment3';

/**
 * @description handles filter events from the UI sent to the datasource, in this case a service call
 */
export class SummaryDataSource extends DataSource<Partial<LastModifiedAssessment3>> {

    public readonly demoMode: boolean = (environment.runMode === 'DEMO');
    protected filterChange = new BehaviorSubject('');
    protected dataChange = new BehaviorSubject(undefined);

    constructor(protected assessService: AssessService, protected creatorId?: string) {
        super();
    }

    /**
     * @description connect interface for datasource, listens to filter events and fetch/filters data accordingly
     * @param collectionViewer
     */
    public connect(collectionViewer: CollectionViewer): Observable<Partial<LastModifiedAssessment3>[]> {
        const arr = [this.filterChange, this.dataChange];
        return Observable.merge(...arr)
            .switchMap(() => {
                const val = this.filterChange.getValue();
                const filterVal = val.trim().toLowerCase() || '';
                const assessments$ = this.fetchAssessments(); // .let(this.dedupByRollupId);
                if (!filterVal || filterVal.length === 0) {
                    return assessments$;
                }

                return assessments$
                    .map((el) => {
                        return el.filter((_) => _.name.trim().toLowerCase().includes(filterVal));
                    });
            });
    }

    /**
     * @description disconnect interface for datasource
     * @param collectionViewer 
     */
    public disconnect(collectionViewer: CollectionViewer): void {
        console.log('disconnect from datasource');
    }

    /**
     * @description trigger a filter event
     */
    public nextFilter(filter?: string): void {
        filter = filter || '';
        filter = filter.trim();
        this.filterChange.next(filter);
    }

    /**
     * @description trigger a data change event
     */
    public nextDataChange(event: any): void {
        this.dataChange.next(undefined);
    }

    /**
     * @description given objects with duplicate names, dedup the names by rollupId
     * @param {Observable<Partial<LastModifiedAssessment>[]>} o$
     * @return {Observable<Partial<LastModifiedAssessment>[]>}
     */
    public dedupByRollupId(o$: Observable<Partial<LastModifiedAssessment3>[]>): Observable<Partial<LastModifiedAssessment3>[]> {
        return o$.map((val) => {
            const uniqIds = Array.from(new Set(val.map((el) => el.rollupId)));
            const uniq = uniqIds
                .map((key) => {
                    return val.find((el) => el.rollupId === key);
                });
            return uniq;
        });
    }

    /**
     * @description fetch the last modified summary for this user or the system as necessary
     * @return {Observable<Partial<LastModifiedAssessment>[]>}
     */
    public fetchAssessments(): Observable<Partial<LastModifiedAssessment3>[]> {
        if (!this.demoMode && this.creatorId && this.creatorId.trim() !== '') {
            return this.fetchWithCreatorId(this.creatorId);
        } else {
            return this.fetchWithNoCreatorId();
        }
    }

    /**
     * @description
     *  fetch assessments by their owner, then fallback and show a group assessment if needed
     * @param {string} creatorId
     * @return {Observable<Partial<LastModifiedAssessment>[]>}
     */
    public fetchWithCreatorId(creatorId: string): Observable<Partial<LastModifiedAssessment3>[]> {
        return this.assessService
            .getLatestAssessmentsByCreatorId(creatorId)
            .switchMap((data: any[]) => {
                if (!data || data.length < 1) {
                    return this.fetchWithNoCreatorId();
                } else {
                    return Observable.of(data);
                }
            });
    }

    /**
     * @description show last modified group assessments
     * @return {Observable<Partial<LastModifiedAssessment>[]>}
     */
    public fetchWithNoCreatorId(): Observable<Partial<LastModifiedAssessment3>[]> {
        return this.assessService
            .getLatestAssessments();
    }
}
