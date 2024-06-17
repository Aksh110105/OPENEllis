import React, { useContext, useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Form,
  Heading,
  Button,
  Loading,
  Grid,
  Column,
  Section,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableHeader,
  TableCell,
  TableSelectRow,
  TableSelectAll,
  TableContainer,
  Pagination,
  Search,
  TextInput,
} from "@carbon/react";
import {
  getFromOpenElisServer,
  postToOpenElisServer,
  postToOpenElisServerFormData,
  postToOpenElisServerFullResponse,
  postToOpenElisServerJsonResponse,
} from "../../utils/Utils.js";
import { NotificationContext } from "../../layout/Layout.js";
import {
  AlertDialog,
  NotificationKinds,
} from "../../common/CustomNotification.js";
import { Field, Formik } from "formik";
import { FormattedMessage, injectIntl, useIntl } from "react-intl";
import PageBreadCrumb from "../../common/PageBreadCrumb.js";

let breadcrumbs = [
  { label: "home.label", link: "/" },
  { label: "breadcrums.admin.managment", link: "/MasterListsPage" },
  {
    label: "organization.main.title",
    link: "/MasterListsPage#organizationManagement",
  },
];

function OrganizationAddModify() {
  const { notificationVisible, setNotificationVisible, addNotification } =
    useContext(NotificationContext);

  const componentMounted = useRef(false);
  const intl = useIntl();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [orgSelectedTypeOfActivity, setOrgSelectedTypeOfActivity] = useState(
    [],
  );
  const [orgInfo, setOrgInfo] = useState({});
  const [orgInfoPost, setOrgInfoPost] = useState({});
  const [saveButton, setSaveButton] = useState(true);
  const [typeOfActivity, setTypeOfActivity] = useState();
  const [typeOfActivityShow, setTypeOfActivityShow] = useState([]);
  const [id, setId] = useState(null);

  //const id = new URLSearchParams(useLocation().search).get("ID");

  useEffect(() => {
    const getIdFromUrl = () => {
      // Get the hash part of the URL
      const hash = window.location.hash;

      // Check if the hash contains the query parameters
      if (hash.includes('?')) {
        // Extract the query part from the hash
        const queryParams = hash.split('?')[1];

        // Create a URLSearchParams object to easily access the parameters
        const urlParams = new URLSearchParams(queryParams);

        // Get the value of the 'ID' parameter
        const id = urlParams.get('ID');

        return id;
      }
      return null;
    };

    const extractedId = getIdFromUrl();
    setId(extractedId);
  }, []);

  useEffect(() => {
    componentMounted.current = true;
    setLoading(true);
    if (id) {
      getFromOpenElisServer(
        `/rest/Organization?ID=${id}&startingRecNo=1`,
        handleMenuItems,
      );
    }
    return () => {
      componentMounted.current = false;
    };
  }, [id]);

  const handleMenuItems = (res) => {
    if (!res) {
      setLoading(true);
    } else {
      setTypeOfActivity(res);
    }
  };

  useEffect(() => {
    if (typeOfActivity) {
      const newOrganizationsManagementList = typeOfActivity.orgTypes.map(
        (item) => {
          return {
            id: item.id,
            name: item.name,
            description: item.description,
          };
        },
      );
      const newOrganizationsManagementListArray = Object.values(
        newOrganizationsManagementList,
      );
      setTypeOfActivityShow(newOrganizationsManagementListArray);

      const organizationsManagementIdInfo = {
        id: typeOfActivity.id,
        organizationName: typeOfActivity.organizationName,
        shortName: typeOfActivity.shortName,
        isActive: typeOfActivity.isActive,
        internetAddress: typeOfActivity.internetAddress,
        selectedTypes: typeOfActivity.selectedTypes,
      };

      const organizationsManagementIdInfoPost = {
        departmentList: typeOfActivity.departmentList,
        orgTypes: typeOfActivity.orgTypes,
        id: typeOfActivity.id,
        organizationName: typeOfActivity.organizationName,
        shortName: typeOfActivity.shortName,
        isActive: typeOfActivity.isActive,
        lastupdated: typeOfActivity.lastupdated,
        commune: typeOfActivity.commune,
        village: typeOfActivity.village,
        department: typeOfActivity.department,
        formName: typeOfActivity.formName,
        formMethod: typeOfActivity.formMethod,
        cancelAction: typeOfActivity.cancelAction,
        submitOnCancel: typeOfActivity.submitOnCancel,
        cancelMethod: typeOfActivity.cancelMethod,
        mlsSentinelLabFlag: typeOfActivity.mlsSentinelLabFlag,
        parentOrgName: typeOfActivity.parentOrgName,
        state: typeOfActivity.state,
        internetAddress: typeOfActivity.internetAddress,
        selectedTypes: typeOfActivity.selectedTypes,
      };
      setOrgInfo(organizationsManagementIdInfo);
      setOrgInfoPost(organizationsManagementIdInfoPost);
      setSelectedRowIds(typeOfActivity.selectedTypes);

      if (id !== "0") {
        const organizationSelectedTypeOfActivity =
          typeOfActivity.selectedTypes.map((item) => {
            return {
              id: item,
            };
          });
        const organizationSelectedTypeOfActivityListArray = Object.values(
          organizationSelectedTypeOfActivity,
        );
        setOrgSelectedTypeOfActivity(
          organizationSelectedTypeOfActivityListArray,
        );
      } else {
        setOrgSelectedTypeOfActivity([]);
      }
    }
  }, [typeOfActivity, id]);

  useEffect(() => {
    setOrgInfoPost((prevOrgInfoPost) => ({
      ...prevOrgInfoPost,
      selectedTypes: selectedRowIds,
    }));
  }, [selectedRowIds, orgInfo]);

  // const handlePageChange = ({ page, pageSize }) => {
  //   setPage(page);
  //   setPageSize(pageSize);
  //   setSelectedRowIds([]);
  // };

  function handleOrgNameChange(e) {
    setSaveButton(false);
    setOrgInfoPost((prevOrgInfoPost) => ({
      ...prevOrgInfoPost,
      organizationName: e.target.value,
    }));
    setOrgInfo((prevOrgInfo) => ({
      ...prevOrgInfo,
      organizationName: e.target.value,
    }));
  }

  function handleOrgPrefixChange(e) {
    setSaveButton(false);
    setOrgInfoPost((prevOrgInfoPost) => ({
      ...prevOrgInfoPost,
      shortName: e.target.value,
    }));
    setOrgInfo((prevOrgInfo) => ({
      ...prevOrgInfo,
      shortName: e.target.value,
    }));
  }

  function handleIsActiveChange(e) {
    setSaveButton(false);
    setOrgInfoPost((prevOrgInfoPost) => ({
      ...prevOrgInfoPost,
      isActive: e.target.value,
    }));
    setOrgInfo((prevOrgInfo) => ({
      ...prevOrgInfo,
      isActive: e.target.value,
    }));
  }

  function handleInternetAddressChange(e) {
    setSaveButton(false);
    setOrgInfoPost((prevOrgInfoPost) => ({
      ...prevOrgInfoPost,
      internetAddress: e.target.value,
    }));
    setOrgInfo((prevOrgInfo) => ({
      ...prevOrgInfo,
      internetAddress: e.target.value,
    }));
  }

  function submitAddUpdatedOrgInfo() {
    setLoading(true);
    postToOpenElisServerJsonResponse(
      `/rest/Organization?ID=${id}&startingRecNo=1`,
      JSON.stringify(orgInfoPost),
      () => {
        submitAddUpdatedOrgInfoCallback();
      },
    );
  }

  const submitAddUpdatedOrgInfoCallback = () => {
    setLoading(false);
    addNotification({
      title: intl.formatMessage({
        id: "notification.title",
      }),
      message: intl.formatMessage({
        id: "notification.organization.post.success",
      }),
      kind: NotificationKinds.success,
    });
    setTimeout(() => {
      window.location.assign("/MasterListsPage#organizationManagement");
    }, 2000);
    setNotificationVisible(true);
  };

  const renderCell = (cell, row) => {
    if (cell.info.header === "select") {
      return (
        <TableSelectRow
          key={cell.id}
          id={cell.id}
          checked={selectedRowIds.includes(row.id)}
          name="selectRowCheckbox"
          ariaLabel="selectRows"
          onSelect={() => {
            setSaveButton(false);
            if (selectedRowIds.includes(row.id)) {
              setSelectedRowIds(selectedRowIds.filter((id) => id !== row.id));
            } else {
              setSelectedRowIds([...selectedRowIds, row.id]);
            }
          }}
        />
      );
    } else if (cell.info.header === "active") {
      return <TableCell key={cell.id}>{cell.value.toString()}</TableCell>;
    } else {
      return <TableCell key={cell.id}>{cell.value}</TableCell>;
    }
  };

  if (!loading) {
    return (
      <>
        <Loading />
      </>
    );
  }

  return (
    <>
      {notificationVisible === true ? <AlertDialog /> : ""}
      <div className="adminPageContent">
        <PageBreadCrumb breadcrumbs={breadcrumbs} />
        <Grid fullWidth={true}>
          <Column lg={16} md={8} sm={4}>
            <Section>
              <Heading>
                {id === "0" ? (
                  <FormattedMessage id="organization.add.title" />
                ) : (
                  <FormattedMessage id="organization.edit.title" />
                )}
              </Heading>
            </Section>
          </Column>
        </Grid>
        <br />
        <div className="orderLegendBody">
          <Grid fullWidth={true} className="gridBoundary">
            <Column lg={16} md={8} sm={4}>
              <Form
              // onSubmit={handleSubmit}
              // onChange={setSaveButton(false)}
              // onBlur={handleBlur}
              >
                <Grid fullWidth={true}>
                  <Column lg={8} md={4} sm={4}>
                    <>
                      <FormattedMessage id="organization.organizationName" />
                      <span className="requiredlabel">*</span> :
                    </>
                  </Column>
                  <Column lg={8} md={4} sm={4}>
                    <TextInput
                      id="org-name"
                      className="defalut"
                      type="text"
                      labelText=""
                      placeholder={intl.formatMessage({
                        id: "organization.add.placeholder",
                      })}
                      required={true}
                      // invalid={errors.order && touched.order}
                      // invalidText={errors.order}
                      value={
                        orgInfo && orgInfo.organizationName
                          ? orgInfo.organizationName
                          : ""
                      }
                      onChange={(e) => handleOrgNameChange(e)}
                    />
                  </Column>
                </Grid>
                <Grid fullWidth={true}>
                  <Column lg={8} md={4} sm={4}>
                    <>
                      <FormattedMessage id="organization.short.CI" /> :
                    </>
                  </Column>
                  <Column lg={8} md={4} sm={4}>
                    <TextInput
                      id="org-prefix"
                      className="defalut"
                      type="text"
                      labelText=""
                      placeholder={intl.formatMessage({
                        id: "organization.add.placeholder",
                      })}
                      // invalid={errors.order && touched.order}
                      // invalidText={errors.order}
                      required={true}
                      value={
                        orgInfo && orgInfo.shortName ? orgInfo.shortName : ""
                      }
                      onChange={(e) => handleOrgPrefixChange(e)}
                    />
                  </Column>
                </Grid>
                <Grid fullWidth={true}>
                  <Column lg={8} md={4} sm={4}>
                    <>
                      <FormattedMessage id="organization.isActive" />
                      <span className="requiredlabel">*</span> :
                    </>
                  </Column>
                  <Column lg={8} md={4} sm={4}>
                    <TextInput
                      id="is-active"
                      className="defalut"
                      type="text"
                      labelText=""
                      placeholder={intl.formatMessage({
                        id: "organization.add.placeholder.active",
                      })}
                      required={true}
                      // invalid={errors.order && touched.order}
                      // invalidText={errors.order}
                      value={
                        orgInfo && orgInfo.isActive ? orgInfo.isActive : ""
                      }
                      onChange={(e) => handleIsActiveChange(e)}
                    />
                  </Column>
                </Grid>
                <Grid fullWidth={true}>
                  <Column lg={8} md={4} sm={4}>
                    <>
                      <FormattedMessage id="organization.internetaddress" /> :
                    </>
                  </Column>
                  <Column lg={8} md={4} sm={4}>
                    <TextInput
                      id="internet-address"
                      className="defalut"
                      type="text"
                      labelText=""
                      placeholder={intl.formatMessage({
                        id: "organization.add.placeholder",
                      })}
                      // invalid={errors.order && touched.order}
                      // invalidText={errors.order}
                      value={
                        orgInfo && orgInfo.internetAddress
                          ? orgInfo.internetAddress
                          : ""
                      }
                      onChange={(e) => handleInternetAddressChange(e)}
                    />
                  </Column>
                </Grid>
              </Form>
            </Column>
          </Grid>
          <br />
          <Grid fullWidth={true}>
            <Column lg={16} md={8} sm={4}>
              <Section>
                <Section>
                  <Section>
                    <Heading>
                      <>
                        <FormattedMessage id="organization.type.CI" />
                        <span className="requiredlabel">*</span>
                      </>
                    </Heading>
                  </Section>
                </Section>
              </Section>
            </Column>
          </Grid>
          <br />
          <Grid fullWidth={true} className="gridBoundary">
            <Column lg={16} md={8} sm={4}>
              <br />
              <DataTable
                rows={typeOfActivityShow.slice(
                  (page - 1) * pageSize,
                  page * pageSize,
                )}
                headers={[
                  {
                    key: "select",
                    header: intl.formatMessage({
                      id: "organization.type.CI.select",
                    }),
                  },
                  {
                    key: "name",
                    header: intl.formatMessage({
                      id: "organization.type.CI.name",
                    }),
                  },

                  {
                    key: "description",
                    header: intl.formatMessage({
                      id: "organization.type.CI.description",
                    }),
                  },
                ]}
              >
                {({
                  rows,
                  headers,
                  getHeaderProps,
                  getTableProps,
                  getSelectionProps,
                }) => (
                  <TableContainer>
                    <Table {...getTableProps()}>
                      <TableHead>
                        <TableRow>
                          <TableSelectAll
                            id="table-select-all"
                            {...getSelectionProps()}
                            checked={
                              selectedRowIds.length === pageSize &&
                              typeOfActivityShow
                                .slice((page - 1) * pageSize, page * pageSize)
                                .filter(
                                  (row) =>
                                    !row.disabled &&
                                    selectedRowIds.includes(row.id),
                                ).length === pageSize
                            }
                            indeterminate={
                              selectedRowIds.length > 0 &&
                              selectedRowIds.length <
                                typeOfActivityShow
                                  .slice((page - 1) * pageSize, page * pageSize)
                                  .filter((row) => !row.disabled).length
                            }
                            onSelect={() => {
                              setSaveButton(false);
                              const currentPageIds = typeOfActivityShow
                                .slice((page - 1) * pageSize, page * pageSize)
                                .filter((row) => !row.disabled)
                                .map((row) => row.id);
                              if (
                                selectedRowIds.length === pageSize &&
                                currentPageIds.every((id) =>
                                  selectedRowIds.includes(id),
                                )
                              ) {
                                setSelectedRowIds([]);
                              } else {
                                setSelectedRowIds(
                                  currentPageIds.filter(
                                    (id) => !selectedRowIds.includes(id),
                                  ),
                                );
                              }
                            }}
                          />
                          {headers.map(
                            (header) =>
                              header.key !== "select" && (
                                <TableHeader
                                  key={header.key}
                                  {...getHeaderProps({ header })}
                                >
                                  {header.header}
                                </TableHeader>
                              ),
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <>
                          {rows.map((row) => (
                            <TableRow
                              key={row.id}
                              onClick={() => {
                                const id = row.id;
                                const isSelected = selectedRowIds.includes(id);
                                if (isSelected) {
                                  setSelectedRowIds(
                                    selectedRowIds.filter(
                                      (selectedId) => selectedId !== id,
                                    ),
                                  );
                                } else {
                                  setSelectedRowIds([...selectedRowIds, id]);
                                }
                              }}
                            >
                              {row.cells.map((cell) => renderCell(cell, row))}
                            </TableRow>
                          ))}
                        </>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </DataTable>
              {/* <Pagination
                onChange={handlePageChange}
                page={page}
                pageSize={pageSize}
                pageSizes={[5, 10, 20]}
                totalItems={typeOfActivityShow.length}
                forwardText={intl.formatMessage({
                  id: "pagination.forward",
                })}
                backwardText={intl.formatMessage({
                  id: "pagination.backward",
                })}
                itemRangeText={(min, max, total) =>
                  intl.formatMessage(
                    { id: "pagination.item-range" },
                    { min: min, max: max, total: total },
                  )
                }
                itemsPerPageText={intl.formatMessage({
                  id: "pagination.items-per-page",
                })}
                itemText={(min, max) =>
                  intl.formatMessage(
                    { id: "pagination.item" },
                    { min: min, max: max },
                  )
                }
                pageNumberText={intl.formatMessage({
                  id: "pagination.page-number",
                })}
                pageRangeText={(_current, total) =>
                  intl.formatMessage(
                    { id: "pagination.page-range" },
                    { total: total },
                  )
                }
                pageText={(page, pagesUnknown) =>
                  intl.formatMessage(
                    { id: "pagination.page" },
                    { page: pagesUnknown ? "" : page },
                  )
                }
              /> */}
              <br />
            </Column>
          </Grid>
          <br />
          <Grid fullWidth={true}>
            <Column lg={16} md={8} sm={4}>
              <Button
                disabled={saveButton}
                onClick={submitAddUpdatedOrgInfo}
                type="button"
              >
                Save
              </Button>{" "}
              <Button
                onClick={() =>
                  window.location.assign(
                    "/MasterListsPage#organizationManagement",
                  )
                }
                kind="tertiary"
                type="button"
              >
                Exit
              </Button>
            </Column>
          </Grid>
        </div>
      </div>
    </>
  );
}

export default injectIntl(OrganizationAddModify);
