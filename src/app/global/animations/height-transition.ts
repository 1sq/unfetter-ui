import { trigger, transition, style, animate, state, AnimationTriggerMetadata } from '@angular/animations';

export const heightTransition = (collapsedHeight: number): AnimationTriggerMetadata => {
    return trigger('heightTransition', [
        state('collapsed', style({
            height: `${collapsedHeight}px`
        })),
        state('opened', style({
            height: '*'
        })),
        state('ignore', style({
            height: '*'
        })),
        transition('* <=> *', animate('200ms ease-in-out'))
    ]);
};
