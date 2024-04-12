package org.openelisglobal.common.rest.provider;

import java.util.*;
import java.util.stream.Collectors;
import javax.servlet.http.HttpServletRequest;
import org.openelisglobal.common.exception.LIMSInvalidConfigurationException;
import org.openelisglobal.common.provider.query.PatientSearchResults;
import org.openelisglobal.common.services.DisplayListService;
import org.openelisglobal.common.services.RequesterService;
import org.openelisglobal.common.util.DateUtil;
import org.openelisglobal.login.valueholder.UserSessionData;
import org.openelisglobal.qaevent.form.NonConformingEventForm;
import org.openelisglobal.qaevent.service.NceCategoryService;
import org.openelisglobal.qaevent.valueholder.NcEvent;
import org.openelisglobal.qaevent.worker.NonConformingEventWorker;
import org.openelisglobal.sample.service.SampleService;
import org.openelisglobal.sample.valueholder.Sample;
import org.openelisglobal.sampleitem.service.SampleItemService;
import org.openelisglobal.sampleitem.valueholder.SampleItem;
import org.openelisglobal.search.service.SearchResultsService;
import org.openelisglobal.systemuser.service.SystemUserService;
import org.openelisglobal.systemuser.valueholder.SystemUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class NonConformEventsRestController {

  private final SampleService sampleService;
  private final SampleItemService sampleItemService;
  private final SearchResultsService searchResultsService;
  private final NonConformingEventWorker nonConformingEventWorker;
  private final NceCategoryService nceCategoryService;
  private final RequesterService requesterService;

  private static final String USER_SESSION_DATA = "userSessionData";

  @Autowired
  private SystemUserService systemUserService;

  public NonConformEventsRestController(
    SampleService sampleService,
    SampleItemService sampleItemService,
    SearchResultsService searchResultsService,
    NonConformingEventWorker nonConformingEventWorker,
    NceCategoryService nceCategoryService,
    RequesterService requesterService
  ) {
    this.sampleService = sampleService;
    this.sampleItemService = sampleItemService;
    this.searchResultsService = searchResultsService;
    this.nonConformingEventWorker = nonConformingEventWorker;
    this.nceCategoryService = nceCategoryService;
    this.requesterService = requesterService;
  }

  @GetMapping(
    value = "/rest/nonconformevents",
    produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> getNCESampleSearch(
    @RequestParam(required = false) String lastName,
    @RequestParam(required = false) String firstName,
    @RequestParam(required = false) String STNumber,
    @RequestParam(required = false) String labNumber
  ) {
    try {
      List<Sample> searchResults;
      if (labNumber != null) {
        Sample sample = sampleService.getSampleByAccessionNumber(labNumber);
        searchResults = sample != null ? List.of(sample) : List.of();
      } else {
        List<PatientSearchResults> results =
          searchResultsService.getSearchResults(
            lastName,
            firstName,
            STNumber,
            "",
            "",
            "",
            "",
            "",
            "",
            ""
          );
        searchResults = results
          .stream()
          .flatMap(
            patientSearchResults ->
              sampleService
                .getSamplesForPatient(patientSearchResults.getPatientID())
                .stream()
          )
          .collect(Collectors.toList());
      }

      if (searchResults.isEmpty()) {
        return ResponseEntity.notFound().build();
      } else {
        List<Map<String, Object>> temp = new ArrayList<>();
        for (Sample sample : searchResults) {
          temp.add(addSample(sample));
        }
        return ResponseEntity.ok().body(Map.of("results", temp));
      }
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
        "An error occurred while processing the request."
      );
    }
  }

  @GetMapping(
    value = "/rest/reportnonconformingevent",
    produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> getReportNonConformingEvent(
    @RequestParam Map<String, String> params,
    HttpServletRequest request
  ) {
    try {
      Map<String, Object> eventData = new HashMap<>();
      eventData.put("labOrderNumber", params.get("labOrderNumber"));
      eventData.put("specimenId", params.get("specimenId"));
      eventData.put("currentUserId", params.get("currentUserId"));
      eventData.put("categories", nceCategoryService.getAllNceCategories());

      SystemUser systemUser = systemUserService.getUserById(
        getSysUserId(request)
      );
      eventData.put(
        "name",
        systemUser.getFirstName() + " " + systemUser.getLastName()
      );

      String ncenumber = String.valueOf(System.currentTimeMillis());
      NcEvent event = nonConformingEventWorker.create(
        params.get("labOrderNumber"),
        Arrays.asList(params.get("specimenId").split(",")),
        systemUser.getId(),
        ncenumber
      );

      eventData.put("nceNumber", event.getNceNumber());
      eventData.put("id", event.getId());

      Sample sample = getSampleForLabNumber(params.get("labOrderNumber"));
      if (sample != null) {
        List<SampleItem> sampleItems = new ArrayList<>();
        String[] sampleItemIdArray = params.get("specimenId").split(",");
        for (String s : sampleItemIdArray) {
          SampleItem si = sampleItemService.getData(s);
          sampleItems.add(si);
        }
        eventData.put("specimens", sampleItems);
      }

      eventData.put("currentUserId", getSysUserId(request));

      eventData.put(
        "reportUnits",
        DisplayListService.getInstance()
          .getList(DisplayListService.ListType.TEST_SECTION_ACTIVE)
      );
      requesterService.setSampleId(sample == null ? null : sample.getId());
      eventData.put("site", requesterService.getReferringSiteName());
      eventData.put(
        "prescriberName",
        requesterService.getRequesterLastFirstName()
      );
      eventData.put("nceCategories", nceCategoryService.getAllNceCategories());
      eventData.put(
        "reportDate",
        DateUtil.formatDateAsText(Calendar.getInstance().getTime())
      );

      return ResponseEntity.ok(eventData);
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
        "An error occurred while processing the request."
      );
    }
  }

  @PostMapping(
    value = "/rest/reportnonconformingevent",
    produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<?> postReportNonConformingEvent(
    @RequestBody NonConformingEventForm form
  ) {
    try {
      boolean updated = nonConformingEventWorker.update(form);
      if (updated) {
        return ResponseEntity.ok().body(Map.of("success", true));
      } else {
        return ResponseEntity.ok().body(Map.of("success", false));
      }
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
        "An error occurred while processing the request."
      );
    }
  }

  private Map<String, Object> addSample(Sample sample) {
    Map<String, Object> sampleMap = new HashMap<>();
    sampleMap.put("id", sample.getId());
    List<Map<String, Object>> sampleItemsList = new ArrayList<>();
    List<SampleItem> sampleItems = sampleItemService.getSampleItemsBySampleId(
      sample.getId()
    );
    sampleMap.put("labOrderNumber", sample.getAccessionNumber());

    for (SampleItem sampleItem : sampleItems) {
      Map<String, Object> sampleItemMap = new HashMap<>();
      sampleItemMap.put("id", sampleItem.getId());
      sampleItemMap.put("number", sampleItem.getSortOrder());
      sampleItemMap.put("type", sampleItem.getTypeOfSample().getDescription());
      sampleItemsList.add(sampleItemMap);
    }
    sampleMap.put("sampleItems", sampleItemsList);
    return sampleMap;
  }

  protected String getSysUserId(HttpServletRequest request) {
    UserSessionData usd = (UserSessionData) request
      .getSession()
      .getAttribute(USER_SESSION_DATA);
    if (usd == null) {
      usd = (UserSessionData) request.getAttribute(USER_SESSION_DATA);
      if (usd == null) {
        return null;
      }
    }
    return String.valueOf(usd.getSystemUserId());
  }

  private Sample getSampleForLabNumber(String labNumber)
    throws LIMSInvalidConfigurationException {
    return sampleService.getSampleByAccessionNumber(labNumber);
  }
}