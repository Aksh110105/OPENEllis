import {useContext, useState, useEffect, useRef } from "react";
import { 
    Checkbox, Heading, TextInput, Select, SelectItem, Button, Grid, Column,
    DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
    } from '@carbon/react';
    import { Search} from '@carbon/react';
    import { getFromOpenElisServer, postToOpenElisServerFullResponse, hasRole } from "../utils/Utils";
import { NotificationContext } from "../layout/Layout";
import {AlertDialog} from "../common/CustomNotification";

function ImmunohistochemistryDashboard() {

  const componentMounted = useRef(false);

  const { notificationVisible ,setNotificationVisible,setNotificationBody} = useContext(NotificationContext);
  const [counts ,setCounts] = useState({ inProgress: 0, awaitingReview: 0, additionalRequests: 0, complete: 0});
  const [statuses, setStatuses] = useState([]);
  const [immunohistochemistryEntries, setImmunohistochemistryEntries] = useState([])
  const [filters, setFilters] = useState({searchTerm: "", myCases: false, statuses: []});


  const setStatusList = (statusList) => {
    if (componentMounted.current) {
        setStatuses(statusList);
    }
  }

  const assignCurrentUserAsTechnician = (event, immunohistochemistrySampleId) => {
    postToOpenElisServerFullResponse("/rest/immunohistochemistry/assignTechnician?immunohistochemistrySampleId=" + immunohistochemistrySampleId, {}, refreshItems)
  }

  const assignCurrentUserAsPathologist = (event, immunohistochemistrySampleId) => {
    postToOpenElisServerFullResponse("/rest/immunohistochemistry/assignPathologist?immunohistochemistrySampleId=" + immunohistochemistrySampleId, {}, refreshItems)
  }

  const renderCell = (cell, row) => {
    var status = row.cells.find(
      (e) => e.info.header === 'status'
    ).info.header.status;
    var immunohistochemistrySampleId = row.id;
    
    if (cell.info.header === 'assignedTechnician' && !cell.value ) {
      return <TableCell key={cell.id}>
        <Button type="button" onClick={(e) => {assignCurrentUserAsTechnician(e, immunohistochemistrySampleId)}}>Start</Button>
      </TableCell>
    }
    if (cell.info.header === 'assignedPathologist' && !cell.value && status === 'READY_PATHOLOGIST' && hasRole("Pathologist")) {
      return <TableCell key={cell.id}>
        <Button type="button" onClick={(e) => {assignCurrentUserAsPathologist(e, immunohistochemistrySampleId)}}>Start</Button>
      </TableCell>
    } else {
      return <TableCell key={cell.id}>{cell.value}</TableCell>
    }
  }

  const setImmunohistochemistryEntriesWithIds = (entries) => {
    if (componentMounted.current && entries && entries.length > 0) {
      var i = 0;
      setImmunohistochemistryEntries(entries.map((entry) => {
        return {...entry, id: '' + entry.immunohistochemistrySampleId};
      }));
    }
    
  }

  const setStatusFilter = (event) => {
    if (event.target.value === 'All') {
      setFilters({...filters, statuses: statuses});
    } else {
      setFilters({...filters, statuses: [{"value": event.target.value}]});
    }
  }

  const filtersToParameters = () => {
    return "statuses=" + filters.statuses.map((entry) => {
      return entry.id;
    }).join(",");
  }

  const refreshItems = () => {
    getFromOpenElisServer("/rest/immunohistochemistry/dashboard?" + filtersToParameters(), setImmunohistochemistryEntriesWithIds);
  }

  const openCaseView = (id) => {
    window.location.href = "/ImmunohistochemistryCaseView/" + id;
  }

  useEffect(() => {
    componentMounted.current = true;
    getFromOpenElisServer("/rest/displayList/IMMUNOHISTOCHEMISTRY_STATUS", setStatusList);

    return () => {
      componentMounted.current = false;
    }
  }, []);

  useEffect(() => {
    componentMounted.current = true;
    setFilters({...filters, statuses: statuses});

    return () => {
      componentMounted.current = false
    }
  }, [statuses]);

  

  useEffect(() => {
    componentMounted.current = true;
    refreshItems();
    return () => {
      componentMounted.current = false
    }
  }, [filters]);

  return (
    <>
        {notificationVisible === true ? <AlertDialog/> : ""}
        <Grid fullWidth={true} className="gridBoundary">
                    <Column lg={16} md={8} sm={4}>
        <Heading>
            Immunohistochemistry
        </Heading>
        </Column>
        <Column lg={4} md={2} sm={1}>
        {counts.inProgress} Cases in Progress 
        </Column>
        <Column lg={4} md={2} sm={1}>
        {counts.awaitingReview} Awaiting Immunohistochemistry Review 
        </Column>
        <Column lg={4} md={2} sm={1}>
        {counts.additionalRequests} Additional Immunohistochemistry Requests
        </Column>
        <Column lg={4} md={2} sm={1}/>
        <Column lg={16} md={8} sm={4} style={{"marginBottom": "1rem" ,"marginTop": "1rem"}}>
        {counts.complete} Complete</Column>
        <Column lg={8} md={4} sm={2}>
        <Search
              size="sm"
              value={filters.searchTerm}
              onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
              placeholder='Search by LabNo or Family Name'
              labelText="Search by LabNo or Family Name"
            />
        </Column>
        <Column lg={8} md={4} sm={2}>
            <div className="inlineDivBlock">
            <div >Filters:</div>
            <Checkbox labelText="My cases" 
              id="filterMyCases"
              value={filters.myCases}
              onChange={(e) => setFilters({...filters, myCases: e.target.checked})}/>
            <Select id="statusFilter"
                    name="statusFilter"
                    labelText="Status"
                    defaultValue="placeholder"
                    onChange={setStatusFilter}
                    noLabel
                    >
                        <SelectItem disabled hidden value="placeholder" text="Status"/>
                        <SelectItem text="All" value="All"
                        />
                    {statuses.map((status, index) => {
                        return (<SelectItem key={index}
                                            text={status.value}
                                            value={status.id}
                        />);
                    })}</Select></div>
        </Column>
        
        <Column lg={16} md={8} sm={4}>
        <DataTable rows={immunohistochemistryEntries} headers={[
    {
      key: 'requestDate',
      header: 'Request Date',
    },
    {
      key: 'status',
      header: 'Stage',
    },
    {
      key: 'lastName',
      header: 'Last Name',
    },
    {
      key: 'firstName',
      header: 'First Name',
    },
    {
      key: 'assignedTechnician',
      header: 'Assigned Technician',
    },
    {
      key: 'assignedPathologist',
      header: 'Assigned Pathologist',
    },
    {
      key: 'labNumber',
      header: 'Lab Number',
    },
  ]} isSortable >
                    {({ rows, headers, getHeaderProps, getTableProps }) => (
                        <TableContainer title="" description="">
                            <Table {...getTableProps()}>
                                <TableHead>
                                    <TableRow>
                                        {headers.map((header) => (
                                            <TableHeader {...getHeaderProps({ header })}>
                                                {header.header}
                                            </TableHeader>
                                        ))}
                                    </TableRow>

                                </TableHead>
                                <TableBody>
                                <>
                                  {rows.map((row) => (
                                    <TableRow key={row.id} onClick={() => {openCaseView(row.id)}}>
                                      {row.cells.map((cell) => (
                                        renderCell(cell, row)
                                      ))}
                                    </TableRow>
                                  ))}
                                </>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DataTable>
                </Column>
                </Grid>
    </>
)
}

export default ImmunohistochemistryDashboard;