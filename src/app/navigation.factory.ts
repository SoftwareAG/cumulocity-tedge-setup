import { Injectable } from '@angular/core';
import { NavigatorNode, NavigatorNodeFactory, _ } from '@c8y/ngx-components';

@Injectable()
export class EdgeNavigationFactory implements NavigatorNodeFactory {
    nav: NavigatorNode[] = [];
    // Implement the get()-method, otherwise the ExampleNavigationFactory
    // implements the NavigatorNodeFactory interface incorrectly (!)
    constructor() {

        let Setup: NavigatorNode = new NavigatorNode({
            label: _('Setup'),
            icon: 'c8y-administration',
            path: '/setup',
            priority: 2,
            routerLinkExact: false
        });

        let Certificate: NavigatorNode = new NavigatorNode({
            path: '/certificate',
            label: _('Certificate'),
            priority: 90,
            icon: 'certificate',
            children: [Setup],
            routerLinkExact: false
        });

        let Analysis: NavigatorNode = new NavigatorNode({
            path: '/analysis',
            label: _('Analysis'),
            priority: 100,
            icon: 'area-chart',
            routerLinkExact: false
        });

        let Cloud: NavigatorNode = new NavigatorNode({
            path: '/cloud',
            label: _('Cloud'),
            name: 'cloud',
            priority: 100,
            icon: 'cloud',
            routerLinkExact: false
        });
        this.nav.push(Certificate, Analysis, Cloud);
    }

    get() {
        return this.nav;
    }
}