/*
 * Copyright 2015 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.kie.wb.selenium.model.persps;

import org.jboss.arquillian.graphene.findby.FindByJQuery;
import org.kie.wb.selenium.model.persps.authoring.ImportExampleModal;
import org.kie.wb.selenium.model.persps.authoring.ProjectEditor;
import org.kie.wb.selenium.model.persps.authoring.ProjectExplorer;
import org.kie.wb.selenium.model.widgets.ContextNavbar;
import org.kie.wb.selenium.util.Repository;
import org.kie.wb.selenium.util.Waits;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class ProjectAuthoringPerspective extends AbstractPerspective {

    private static final By WELCOME_MESSAGE_HOLDER = By.id("welcome");
    private static final By PROJECT_EXPLORER_TITLE = By.xpath( "//h3[contains(text(),'Project Explorer')]" );
    private static final By NEW_ITEM_MENU = By.xpath( "//a[contains(text(),'New Item')]" );

    @FindByJQuery(".nav.uf-perspective-context-menu")
    private ContextNavbar contextNavbar;

    @FindBy(xpath = "//div[div/h3[contains(text(),'Project Explorer')]]")
    private ProjectExplorer projectExplorer;

    @FindByJQuery("button:has(i.fa-chevron-right)")
    private WebElement projectExplorerExpandButton;

    @Override
    public void waitForLoaded() {
        //Don't check for specific elements to appear as the ProjectLibraryPerspective may have been shown
        Waits.pause( 500 );
    }

    @Override
    public boolean isDisplayed() {
        return Waits.isElementPresent(NEW_ITEM_MENU);
    }

    public boolean isAuthoringDisabled(){
        return Waits.isElementPresent(WELCOME_MESSAGE_HOLDER);
    }

    public void importStockExampleProject( String targetRepo,
                                           String targetOrgUnit,
                                           String... projects ) {
        ImportExampleModal modal = contextNavbar.importExample();
        modal.selectStockRepository();
        modal.selectProjects( projects );
        modal.setTargetRepoAndOrgUnit( targetRepo, targetOrgUnit );
    }

    public void importCustomExampleProject( Repository repo,
                                            String targetRepo,
                                            String targetOrgUnit,
                                            String... projects ) {
        ImportExampleModal modal = contextNavbar.importExample();
        modal.selectCustomRepository( repo.getUrl() );
        modal.selectProjects( projects );
        modal.setTargetRepoAndOrgUnit( targetRepo, targetOrgUnit );
    }

    public ProjectExplorer getProjectExplorer() {
        return projectExplorer;
    }

    public ProjectEditor openProjectEditor() {
        if (!Waits.isElementPresent(PROJECT_EXPLORER_TITLE)){
            projectExplorerExpandButton.click();
            Waits.elementPresent(PROJECT_EXPLORER_TITLE);
        }
        getProjectExplorer().openProjectEditor();
        return createPanel(ProjectEditor.class, "Project:");
    }
}
