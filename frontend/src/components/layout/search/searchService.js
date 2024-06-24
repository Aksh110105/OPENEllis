import { useState, useEffect } from "react";
import {getFromOpenElisServer} from "../../utils/Utils"
export const fetchPatientData = async (query, callback) => {
    const [firstName, lastName] = query.split(" ");
    const endpoints = [
      `/search/results?firstName=${firstName}`,
      `/search/results?lastName=${lastName || query}`,
      `/search/results?dateOfBirth=${query}`,
      `/search/results?nationalID=${query}`,
      `/search/results?patientID=${query}`,
      `/search/results?guid=${query}`,
      `/search/results?subjectNumber=${query}`,
      `/search/results?gender=${query}`,
      lastName ? `/search/results?firstName=${firstName}&lastName=${lastName}` : null
    ].filter(Boolean);
  
    const fetchEndpointData = async (endpoint) => {
      return new Promise((resolve, reject) => {
        getFromOpenElisServer(endpoint, (response) => {
          if (response && response.length > 0) {
            resolve(response);
          } else {
            resolve(null); // Resolve with null for endpoints with no results
          }
        });
      });
    };
  
    try {
      const results = await Promise.all(endpoints.map(fetchEndpointData));
      const filteredResults = results.filter(result => result !== null);
      const combinedResults = [].concat(...filteredResults);
      const uniqueResults = combinedResults.filter((value, index, self) =>
        index === self.findIndex((t) => (
          t.patientID === value.patientID
        ))
      );
  
      callback(uniqueResults);
    } catch (error) {
      callback([]); // Handle error by returning an empty array
    }
  };
  export const openPatientResults = (patientId) => {
    if (patientId) {
      window.location.href = "/ModifyOrder?patientId=" + patientId;
    }
  };


  export const useAutocomplete = (props) => {
    const allowFreeText = props.allowFreeText;
  
    const [textValue, setTextValue] = useState("");
    const [activeSuggestion, setActiveSuggestion] = useState(0);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [userInput, setUserInput] = useState("");
    const [invalid, setInvalid] = useState(false);
    const [initialised, setInitialised] = useState(false);
  
    useEffect(() => {
      if (props.value && !initialised) {
        if (props.suggestions) {
          const filteredSuggestion = props.suggestions.filter(
            (suggestion) =>
              suggestion.id === props.value
          );
          if (filteredSuggestion[0]) {
            setTextValue(filteredSuggestion[0].value);
          } else {
            setTextValue(props.value);
          }
        }
      }
    }, [props, initialised]);
  
    const onChange = (e) => {
      const { suggestions } = props;
      const userInput = e?.currentTarget?.value || "";
      setTextValue(userInput);
  
      if (suggestions) {
        const filteredSuggestions = suggestions.filter(
          (suggestion) =>
            suggestion.value.toLowerCase().indexOf(userInput.toLowerCase()) > -1
        );
  
        setActiveSuggestion(0);
        setFilteredSuggestions(filteredSuggestions);
        setUserInput(userInput);
        setShowSuggestions(true);
        setInitialised(true);
  
        if (filteredSuggestions.length === 0 && !allowFreeText) {
          setInvalid(true);
        }
        if (typeof props.onChange === "function") {
          props.onChange(e);
        }
      }
    };
  
    const onClick = (e, id, suggestion) => {
      const { onSelect } = props;
      setTextValue(suggestion.value);
      setActiveSuggestion(0);
      setFilteredSuggestions([]);
      setUserInput(e.currentTarget.innerText);
      setShowSuggestions(false);
      setInvalid(false);
  
      if (typeof onSelect === "function") {
        onSelect(id);
      }
    };
  
    const onDelete = (id) => {
      const updatedSuggestions = filteredSuggestions.filter(
        (suggestion) => suggestion.id !== id
      );
      setFilteredSuggestions(updatedSuggestions);
  
      if (props.onDelete) {
        props.onDelete(id);
      }
    };
  
    const onKeyDown = (e) => {
      if (e.keyCode === 13) {
        setActiveSuggestion(0);
        setUserInput(filteredSuggestions[activeSuggestion]);
        setShowSuggestions(false);
      } else if (e.keyCode === 38) {
        if (activeSuggestion === 0) {
          return;
        }
        setActiveSuggestion(activeSuggestion - 1);
      } else if (e.keyCode === 40) {
        if (activeSuggestion - 1 === filteredSuggestions.length) {
          return;
        }
        setActiveSuggestion(activeSuggestion + 1);
      }
    };
  
    return {
      textValue,
      activeSuggestion,
      filteredSuggestions,
      showSuggestions,
      userInput,
      invalid,
      onChange,
      onClick,
      onKeyDown,
      onDelete, 
    };
  }