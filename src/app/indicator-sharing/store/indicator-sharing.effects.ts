import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';

import * as indicatorSharingActions from './indicator-sharing.actions';
import * as fromIndicatorSharing from './indicator-sharing.reducers';
import { WebsocketService } from '../../core/services/web-socket.service';
import { WSMessageTypes } from '../../global/enums/ws-message-types.enum';
import { GenericApi } from '../../core/services/genericapi.service';
import { IndicatorSharingService } from '../indicator-sharing.service';
import { Constance } from '../../utils/constance';
import { SearchParameters } from '../models/search-parameters';
import { RxjsHelpers } from '../../global/static/rxjs-helpers';

@Injectable()
export class IndicatorSharingEffects {

    public indicatorUrl = Constance.INDICATOR_URL;

    // NOTE can/does this unsubscribe when leaving the module?
    @Effect()
    public startNotificationStream = this.actions$
        .ofType(indicatorSharingActions.START_SOCIAL_STREAM)
        .switchMap((action: { type: string, payload: string }) => 
            Observable.combineLatest(
                Observable.of(action.payload),
                this.websocketService.connect(WSMessageTypes.SOCIAL)
            )
        )
        .filter(([userId, message]) => message.body.user.id !== userId)
        .map(([userId, message]) => message)
        .map((message) => ({
            type: indicatorSharingActions.UPDATE_SOCIAL,
            payload: message
        }));

    @Effect()
    public fetchData = this.actions$
        .ofType(indicatorSharingActions.FETCH_DATA)
        .switchMap(() => Observable.forkJoin(
            this.indicatorSharingService.getIdentities(),
            this.indicatorSharingService.getIndicators(),
            this.indicatorSharingService.getAttackPatternsByIndicator(),
            this.indicatorSharingService.getSensors(),
            this.indicatorSharingService.getAttackPatterns()
        ))
        .map((results: any[]) => [
            results[0].map((r) => r.attributes),
            results[1].map((r) => r.attributes),
            this.makeIndicatorToAttackPatternMap(results[2].attributes),
            results[3].map((r) => r.attributes),
            results[4].map((r) => r.attributes)
        ])
        .mergeMap(([identities, indicators, indicatorToApMap, sensors, attackPatterns]) => [
            new indicatorSharingActions.SetIdentities(identities),
            new indicatorSharingActions.SetIndicators(indicators),
            new indicatorSharingActions.SetIndicatorToApMap(indicatorToApMap),
            new indicatorSharingActions.SetSensors(sensors),
            new indicatorSharingActions.SetAttackPatterns(attackPatterns),
            new indicatorSharingActions.SetServerCallComplete(true)
        ]);

    @Effect()
    public deleteIndicator = this.actions$
        .ofType(indicatorSharingActions.START_DELETE_INDICATOR)
        .switchMap((action: { type: string, payload: string }) => {
            return Observable.forkJoin(
                Observable.of(action.payload),
                this.genericApi.delete(`${this.indicatorUrl}/${action.payload}`)
            );
        })
        .mergeMap(([indicatorId, deleteResponse]: [string, any]) => [
            new indicatorSharingActions.DeleteIndicator(indicatorId),
            new indicatorSharingActions.FilterIndicators()
        ]);

    @Effect()
    public updateIndicator = this.actions$
        .ofType(indicatorSharingActions.START_UPDATE_INDICATOR)
        .pluck('payload')
        .switchMap((indicator: any) => {
            return Observable.forkJoin(
                this.indicatorSharingService.updateIndicator(indicator),
                Observable.of(indicator)
            );
        })
        .map(([apiResponse, indicator]) => {
            return {
                ...apiResponse.attributes,
                ...indicator
            };
        })
        .mergeMap((indicator: any) => [
            new indicatorSharingActions.UpdateIndicator(indicator),
            new indicatorSharingActions.FilterIndicators(),
            new indicatorSharingActions.RefreshApMap()
        ]);

    @Effect()
    public addIndicator = this.actions$
        .ofType(indicatorSharingActions.ADD_INDICATOR)
        .switchMap((_) => this.indicatorSharingService.getSensors())
        .map((sensorRes) => sensorRes.map((sensor) => sensor.attributes))
        .map((sensors) => new indicatorSharingActions.SetSensors(sensors));

    @Effect()
    public createIndicatorToAttackPatternRelationship = this.actions$
        .ofType(indicatorSharingActions.CREATE_IND_TO_AP_RELATIONSHIP)
        .pluck('payload')
        .switchMap((payload: { indicatorId: string, attackPatternId: string }) => {
            return this.indicatorSharingService.createIndToApRelationship(payload.indicatorId, payload.attackPatternId);
        })
        .map((_) => new indicatorSharingActions.RefreshApMap());
        
    @Effect()
    public refreshApMap = this.actions$
        .ofType(indicatorSharingActions.REFRESH_AP_MAP)
        .switchMap((_) => this.indicatorSharingService.getAttackPatternsByIndicator())
        .map((res: any) => this.makeIndicatorToAttackPatternMap(res.attributes))
        .map((indicatorToApMap) => new indicatorSharingActions.SetIndicatorToApMap(indicatorToApMap));

    @Effect()
    public startSearch = this.actions$
        .ofType(indicatorSharingActions.FILTER_INDICATORS)
        .withLatestFrom(this.store.pluck('indicatorSharing').pluck('searchParameters'))
        .map(([_, searchParameters]: [any, SearchParameters]) => searchParameters)
        .switchMap((searchParameters: SearchParameters) => {
            const filterObj = { };
            if (searchParameters.indicatorName !== '') {
                filterObj['stix.name'] = { $regex: `.*${searchParameters.indicatorName}.*`, $options: 'i' };
            }
            if (searchParameters.labels.length) {
                filterObj['stix.labels'] = { $in: searchParameters.labels };
            }
            if (searchParameters.organizations.length) {
                filterObj['stix.created_by_ref'] = { $in: searchParameters.organizations };
            }
            if (searchParameters.killChainPhases.length) {
                filterObj['stix.kill_chain_phases.phase_name'] = { $in: searchParameters.killChainPhases };
            }
            // TODO figure out a way to handle attack patterns and sensors
            return Observable.forkJoin(
                this.indicatorSharingService.getCount({ ...filterObj, 'stix.type': 'indicator' }),
                this.indicatorSharingService
                    .getIndicatorsPage(Constance.INDICATOR_SHARING_DEFAULT_DISPLAYED_LENGTH, 0, filterObj)
                    .map(RxjsHelpers.mapArrayAttributes)
            );
        })
        .do((results) => console.log('~~SEARCH RESULTS~~', results))
        .mergeMap(([count, indicators]: [number, any]) => { 
            return [
                new indicatorSharingActions.SetResultCount(count)
            ];
        });

    constructor(
        private actions$: Actions,
        private store: Store<fromIndicatorSharing.IndicatorSharingFeatureState>,
        private websocketService: WebsocketService,
        private genericApi: GenericApi,
        private indicatorSharingService: IndicatorSharingService
    ) { }

    private makeIndicatorToAttackPatternMap(attackPatternsByIndicator) {
        const indicatorToAttackPatternMap: any = {};
        attackPatternsByIndicator.forEach((item) => indicatorToAttackPatternMap[item._id] = item.attackPatterns);
        return indicatorToAttackPatternMap
    }
}
