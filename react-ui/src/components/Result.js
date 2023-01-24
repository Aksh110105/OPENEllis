import React from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import './Style.css'
import ResultSearch from './resultPage/ResultSearch';
import { BrowserRouter as Router, Route, Switch, useMatch } from "react-router-dom";
import PathRoute from "./utils/PathRoute"
import {
    SideNav,
    SideNavItems,
    SideNavMenu,
    SideNavMenuItem
} from '@carbon/react';

class Result extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
        }
    }

    render() {
        return (
            <>
                <SideNav
                    aria-label="Side navigation"
                    expanded={true}
                >
                    <SideNavItems className="resultSideNav">
                        <SideNavMenu title="Result Search">
                            <SideNavMenuItem href="#result" >by Accession Number</SideNavMenuItem>
                            <SideNavMenuItem href="#1"> Link</SideNavMenuItem>
                            <SideNavMenuItem href="#2">Link</SideNavMenuItem>
                        </SideNavMenu>
                        <SideNavMenu title="User Management">
                            <SideNavMenuItem href="#3">Link</SideNavMenuItem>
                            <SideNavMenuItem href="#4">Link</SideNavMenuItem>
                            <SideNavMenuItem href="#5">Link</SideNavMenuItem>
                        </SideNavMenu>
                        <SideNavMenu title="Organization Management">
                            <SideNavMenuItem href="#6">Link</SideNavMenuItem>
                            <SideNavMenuItem href="#7">Link</SideNavMenuItem>
                            <SideNavMenuItem href="#8">Link</SideNavMenuItem>
                        </SideNavMenu>
                    </SideNavItems>
                </SideNav>

                <PathRoute path="#result">
                    <ResultSearch />
                </PathRoute>
            </>

        );

    }
}


export default injectIntl(Result)