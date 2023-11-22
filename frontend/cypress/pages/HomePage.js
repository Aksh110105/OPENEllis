import LoginPage from "./LoginPage";
import PatientEntryPage from "./PatientEntryPage";
import OrderEntityPage from "./OrderEntityPage";
import WorkPlan from "./WorkPlan";
import ModifyOrderPage from "./ModifyOrderPage";

class HomePage {
    constructor() {
    }

    visit() {
        cy.visit('/');
    }

    goToSign() {
        return new LoginPage();
    }

    goToOrderPage() {
        this.openNavigationMenu();
        cy.getElement('li:nth-of-type(1) > .cds--side-nav__submenu > .cds--side-nav__icon.cds--side-nav__icon--small.cds--side-nav__submenu-chevron').click();
        cy.getElement('li:nth-of-type(1) > .cds--side-nav__menu > li:nth-of-type(1) > .cds--side-nav__link').click();
        return new OrderEntityPage();
    }

    goToModifyOrderPage() {
        this.openNavigationMenu();
        cy.getElement('li:nth-of-type(1) > .cds--side-nav__submenu > .cds--side-nav__icon.cds--side-nav__icon--small.cds--side-nav__submenu-chevron').click();
        cy.getElement('li:nth-of-type(1) > .cds--side-nav__menu > li:nth-of-type(2) > .cds--side-nav__link').click();
        return new ModifyOrderPage();
    }

    openNavigationMenu() {
        cy.wait(1000);
        cy.get('header#mainHeader > button[title=\'Open menu\']').click();
    }

    goToPatientEntry() {
        this.openNavigationMenu();
        cy.get('li:nth-of-type(2) > .cds--side-nav__submenu > .cds--side-nav__icon.cds--side-nav__icon--small.cds--side-nav__submenu-chevron').click()
        cy.get('li:nth-of-type(2) > .cds--side-nav__menu > li:nth-of-type(1) > .cds--side-nav__link > .cds--side-nav__link-text').click();
        return new PatientEntryPage();
    }

    goToWorkPlanPlanByTest(){
        this.openNavigationMenu();
        cy.get('.cds--side-nav__items .cds--side-nav__item:nth-of-type(4) .cds--side-nav__submenu-chevron').click()
        cy.get('.cds--side-nav__items .cds--side-nav__item:nth-of-type(4) .cds--side-nav__menu-item:nth-of-type(1) .cds--side-nav__link-text').click();
        return new WorkPlan();
    }

    goToWorkPlanPlanByPanel(){
        this.openNavigationMenu();
        cy.get('.cds--side-nav__items .cds--side-nav__item:nth-of-type(4) .cds--side-nav__submenu-chevron').click()
        cy.get('.cds--side-nav__items .cds--side-nav__item:nth-of-type(4) .cds--side-nav__menu-item:nth-of-type(2) .cds--side-nav__link-text').click();
        return new WorkPlan();
    }
}

export default HomePage;
