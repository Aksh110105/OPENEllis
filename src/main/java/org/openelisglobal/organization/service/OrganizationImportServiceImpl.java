package org.openelisglobal.organization.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import javax.transaction.Transactional;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.validator.GenericValidator;
import org.hl7.fhir.instance.model.api.IBaseBundle;
import org.hl7.fhir.r4.model.Bundle;
import org.hl7.fhir.r4.model.Bundle.BundleEntryComponent;
import org.hl7.fhir.r4.model.Resource;
import org.openelisglobal.common.services.DisplayListService;
import org.openelisglobal.common.services.DisplayListService.ListType;
import org.openelisglobal.dataexchange.fhir.FhirUtil;
import org.openelisglobal.dataexchange.fhir.service.FhirPersistanceService;
import org.openelisglobal.dataexchange.fhir.service.FhirTransformService;
import org.openelisglobal.organization.valueholder.Organization;
import org.openelisglobal.organization.valueholder.OrganizationType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.rest.client.api.IGenericClient;

@Service
public class OrganizationImportServiceImpl implements OrganizationImportService {

    @Value("${org.openelisglobal.facilitylist.fhirstore:}")
    private String facilityFhirStore;

    @Autowired
    private FhirContext fhirContext;
    @Autowired
    private FhirUtil fhirUtil;
    @Autowired
    private FhirTransformService fhirTransformService;
    @Autowired
    private FhirPersistanceService fhirPersistanceService;
    @Autowired
    private OrganizationService organizationService;
    @Autowired
    private OrganizationTypeService organizationTypeService;

    @Override
    @Transactional
    @Scheduled(initialDelay = 1000, fixedRate = 24 * 60 * 60 * 1000)
    @Retryable(value = RuntimeException.class, maxAttempts = 10, backoff = @Backoff(delay = 1000 * 60))
    public void importOrganizationList() {
        if (!GenericValidator.isBlankOrNull(facilityFhirStore)) {
            IGenericClient client = fhirUtil.getFhirClient(facilityFhirStore);
            List<Bundle> responseBundles = new ArrayList<>();
            Bundle responseBundle = client.search().forResource(org.hl7.fhir.r4.model.Organization.class)
                    .returnBundle(Bundle.class).execute();
            responseBundles.add(responseBundle);
            while (responseBundle.getLink(IBaseBundle.LINK_NEXT) != null) {
                responseBundle = client.loadPage().next(responseBundle).execute();
                responseBundles.add(responseBundle);
            }
            organizationService.deactivateAllOrganizations();
            importFromBundle(client, responseBundles);
        }
        DisplayListService.getInstance().refreshList(ListType.REFERRAL_ORGANIZATIONS);
        DisplayListService.getInstance().refreshList(ListType.SAMPLE_PATIENT_REFERRING_CLINIC);
        DisplayListService.getInstance().refreshList(ListType.PATIENT_HEALTH_REGIONS);
    }

    private void importFromBundle(IGenericClient client, List<Bundle> responseBundles) {
        List<String> activateOrgs = new ArrayList<>();
        List<Resource> remoteFhirOrganizations = new ArrayList<>();
        Set<OrganizationType> loadedOrgTypes = new HashSet<>();
        for (Bundle responseBundle : responseBundles) {
            for (BundleEntryComponent entry : responseBundle.getEntry()) {
                if (entry.hasResource()) {
//                    client.delete().resource(entry.getResource()).cascade(DeleteCascadeModeEnum.DELETE).execute();
                    remoteFhirOrganizations.add(entry.getResource());
                    Organization transientOrganization = fhirTransformService.fhirOrganizationToOrganization(
                            (org.hl7.fhir.r4.model.Organization) entry.getResource(), client);
                    // preserve the link to the set of org types
                    Set<OrganizationType> transientOrganizationTypes = transientOrganization.getOrganizationTypes();
                    // clear out the org types so we don't insert ones that should already exist in
                    // the db
                    transientOrganization.setOrganizationTypes(new HashSet<>());
                    // saved separately first so we dont persist a parent per child
                    persistParentOrgWithoutOrgTypes(transientOrganization);
                    Organization dbOrg = insertOrUpdateOrganization(transientOrganization);
                    // make sure it gets activated
                    activateOrgs.add(dbOrg.getOrganizationName());

                    for (OrganizationType transientOrgType : transientOrganizationTypes) {
                        OrganizationType dbOrgType;
                        Optional<OrganizationType> loadedOrgType = findLoadedOrgType(loadedOrgTypes, transientOrgType);

                        if (loadedOrgType.isPresent()) {
                            dbOrgType = loadedOrgType.get();
                        } else {
                            // clear out the orgs so we only use the ones that have been persisted
                            transientOrgType.setOrganizations(new HashSet<>());
                            dbOrgType = insertOrUpdateOrganizationType(transientOrgType);
                        }
                        // rebuild the connections between org type and org using persisted entities
                        dbOrgType.getOrganizations().add(dbOrg);
                        dbOrg.getOrganizationTypes().add(dbOrgType);
                        loadedOrgTypes.add(dbOrgType);
                    }
                }
            }
        }
        organizationService.activateOrganizations(activateOrgs);
        // import fhir organizations as is
        fhirPersistanceService.updateFhirResourcesInFhirStore(remoteFhirOrganizations);
    }

    private void persistParentOrgWithoutOrgTypes(Organization transientOrganization) {
        if (transientOrganization.getOrganization() != null) {
            persistParentOrgWithoutOrgTypes(transientOrganization.getOrganization());
            transientOrganization.getOrganization().setOrganizationTypes(new HashSet<>());
            transientOrganization
                    .setOrganization(this.insertOrUpdateOrganization(transientOrganization.getOrganization()));
        }
    }

    private OrganizationType insertOrUpdateOrganizationType(OrganizationType orgType) {
        OrganizationType dbOrgType = organizationTypeService.getOrganizationTypeByName(orgType.getName());
        if (dbOrgType != null) {
            dbOrgType.setDescription(orgType.getDescription());
            dbOrgType.setOrganizations(orgType.getOrganizations());
        } else {
            dbOrgType = organizationTypeService.save(orgType);
        }
        return dbOrgType;
    }

    private Optional<OrganizationType> findLoadedOrgType(Set<OrganizationType> loadedOrgTypes,
            OrganizationType orgType) {
        return loadedOrgTypes.stream().filter(o -> StringUtils.equals(o.getName(), orgType.getName())).findAny();
    }

    private Organization insertOrUpdateOrganization(Organization organization) {
        Organization dbOrg = organizationService.getOrganizationByName(organization, true);
        if (dbOrg != null) {
            dbOrg.setOrganizationTypes(organization.getOrganizationTypes());
            dbOrg.setOrganizationName(organization.getOrganizationName());
            dbOrg.setOrganization(organization.getOrganization());
            dbOrg.setStreetAddress(organization.getStreetAddress());
            dbOrg.setCity(organization.getCity());
            dbOrg.setZipCode(organization.getZipCode());
            dbOrg.setState(organization.getState());
            dbOrg.setInternetAddress(organization.getInternetAddress());
            dbOrg = organizationService.update(dbOrg);
        } else {
            dbOrg = organizationService.save(organization);
        }
        return dbOrg;
    }

}
