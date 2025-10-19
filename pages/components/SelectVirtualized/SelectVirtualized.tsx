import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DropdownMenu } from "./DropdownMenu";
import FocusTrap from 'focus-trap-react';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import styles from "./VirtualizedSelect.module.scss";

/**
 * Functionality includes: multi-select or not, searchable or not, & takes an onChange callback.
 *
 */

export interface FilterOption {
    label: string,
    value: string,
}

interface DropdownPropsType {
    ariaLabel?: string,
    placeHolder?: string,
    isMulti?: boolean,
    isSearchable?: boolean,
    className?: string,
    remainOpenOnSelect?: boolean,
    onChange: (values: any) => void,
    options: FilterOption[],
    selections?: FilterOption[],
    resetFlag?: boolean,
}

export const selectAllString: string = "Select All";

interface MenuInteraction {
    event: React.MouseEvent<HTMLDivElement, MouseEvent> | React.KeyboardEvent<HTMLDivElement>;
}

/**
 * Generates a controlled component that functions as an HTML Select with a virtualized menu of options.
 *
 * @param ariaLabel  - optional aria-label for the component (defaults to "dropdown-select")
 * @param placeHolder  - placeholder text to show in display if no selection has been made
 * @param isMulti  - optional boolean flag to generate a multiple-select component (defaults to false)
 * @param isSearchable  - optional boolean flag to make options searchable (defaults to false)
 * @param className  - optional className for the component root (appended after "dropdown-container" class)
 * @param remainOpenOnSelect  - optional boolean to keep menu open after making a selection (defaults to false)
 * @param onChange  - required callback function to handle selections
 * @param options  - required array of FilterOption objects that will be set as options
 * @param selections  - optional array of FilterOption objects that will be set as selected options by default
 * @param resetFlag
 * @returns {JSX.Element}
 * @type {{ ariaLabel?: string, placeHolder?: string, isMulti?: boolean,
 *          isSearchable?: boolean, className?: string, remainOpenOnSelect?: boolean; onChange: (values: any) => void,
 *          options: {label: string, value: string}[], selections?: {label: string, value: string}[]}}
 */

export const VirtualizedSelect = ({
                                      ariaLabel,
                                      placeHolder = "Select...",
                                      isMulti = false,
                                      isSearchable = false,
                                      className,
                                      remainOpenOnSelect = false,
                                      onChange,
                                      options,
                                      selections,
                                      resetFlag,
                                  }: DropdownPropsType): JSX.Element => {

    const [searchValue, setSearchValue] = useState("");
    const [activeTrap, setActiveTrap] = useState(false);
    const [selectedValue, setSelectedValue] = useState<FilterOption[]>(
        () => (selections ? [...selections] : [])
    );

    // When `resetFlag` is triggered, revert to provided `selections` (or empty)
    useEffect(() => {
        if (resetFlag) {
            setSelectedValue(selections ? [...selections] : []);
            setSearchValue("");
        }
    }, [resetFlag, selections]);

    // Close the menu or keep it open based on the remainOpenOnSelect prop
    const handleMenuOnInput = () => remainOpenOnSelect ? setActiveTrap(true) : setActiveTrap(!activeTrap);

    // Sets the search value as the test in the search input
    const onSearch = (event: React.ChangeEvent<HTMLInputElement>) =>
        setSearchValue(event.target.value);

    const removeOption = useCallback((option: FilterOption) => {
        if (isMulti && selectedValue) {
            return selectedValue?.filter((it) => it.value !== option.value);
        }
        return selectedValue
    }, [isMulti, selectedValue]);

    // Returns boolean for whether the current selection is in selectedOptions
    const isSelected = (option: FilterOption) => {
        if (isMulti && selectedValue) {
            return selectedValue.findIndex((it) => it.value === option.value) > -1;
        }
        if (!selectedValue) {
            return false;
        }
        return selectedValue[0].value === option.value;
    }

    // Handles selection of options from the menu
    const onItemClick = useCallback((option: FilterOption) => {
        const computeNewValue = (): FilterOption[] => {
            if (option.value === selectAllString) {
                return selectedValue.length === options.length ? [] : options.slice();
            }

            if (isMulti) {
                const exists = selectedValue.some(it => it.value === option.value);
                return exists ? removeOption(option) : [...selectedValue, option];
            }

            return [option];
        };

        const newValue: FilterOption[] = computeNewValue();

        setSelectedValue(newValue);
        onChange(newValue);

        // Toggle menu respecting remainOpenOnSelect, use functional update to avoid stale activeTrap
        if (remainOpenOnSelect) {
            setActiveTrap(true);
        } else {
            setActiveTrap(prev => !prev);
        }
    }, [isMulti, options, selectedValue, removeOption, onChange, remainOpenOnSelect]);

    // Returns the elements to render in Value display (shows the selected option(s))
    const getDisplay = useMemo((): string | React.ReactElement | any => {
        if (!selectedValue || selectedValue.length === 0) {
            return <div>{placeHolder}</div>;
        }
        if (isMulti) {
            return (
                <div className={styles.eiFilterDropdownTags}>
                    {selectedValue.length} of {options.length} selected
                </div>
            );
        }
        return selectedValue[0].label;
    }, [isMulti, placeHolder, selectedValue, options.length]);

    // Grab the options, filtered if there is a searchValue set, and return them for the Virtuoso component
    const getOptions = useMemo(() => {

        // This will be added in if isMulti is true to allow for the clear/select all functionality
        const selectAllOption: FilterOption = { label: selectAllString, value: selectAllString };

        if (!searchValue || !isSearchable) {
            return isMulti ? [selectAllOption, ...options] : options;
        }

        const filteredOptions = options.filter((it) => it.label.toLowerCase().indexOf(searchValue.toLowerCase()) >= 0);

        return isMulti ? [...filteredOptions] : filteredOptions;
    }, [isMulti, isSearchable, options, searchValue])

    const toggleMenu = ({event}: MenuInteraction) => {

        event.stopPropagation()
        event.preventDefault()

        if (!activeTrap) { handleTrap() }

        setActiveTrap(!activeTrap)
    }

    // Sets local state to show/hide and focus/blur dropdown menu
    function handleTrap() {

        if (!activeTrap) {
            setActiveTrap(true);
            setSearchValue("");
        } else {
            setActiveTrap(false);
        }
    }

    return (
        <div className={`${styles.eiFilterDropdownContainer} ${className ?? ""}`}
             onClick={() => {handleTrap()}}
             tabIndex={0}
             onKeyDown={(event) => {
                 if (event.key === "Enter" || event.key === "ArrowDown") handleTrap()
             }}>
            {/*The focus trap is just used to set focus on the internals of the component*/}
            <FocusTrap
                active={activeTrap}
                focusTrapOptions={{
                    onPostDeactivate: () => setActiveTrap(false),
                    clickOutsideDeactivates: true,
                    returnFocusOnDeactivate: true,
                }}
            >
                {/*Top level of the select component*/}
                <div
                    aria-label={ariaLabel ?? "dropdown-select"}
                    className={styles.eiFilterDropdownInput}
                    onClick={(event) => event.stopPropagation()}
                >
                    {/*This container div holds the display text and the MenuIcon button*/}
                    <div
                        className={styles.eiFilterDropdownDisplayContainer}
                        role={"group"}
                        onClick={(event) => toggleMenu({event : event})}
                    >
                        {getDisplay}
                        <div className={styles.eiFilterDropdownTools}>
                            <div
                                className={styles.eiFilterDropdownTool}
                                aria-haspopup={"true"}
                                onClick={(event) => toggleMenu({event : event})}
                                onKeyDown={(event) => {
                                     if (event.key === "Enter" || event.key === "ArrowDown") toggleMenu({event : event})
                                }}
                            >
                                <MenuIcon />
                            </div>
                        </div>
                    </div>
                    {/*The search box element*/}
                    {isSearchable && activeTrap && (
                        <div
                            className={styles.eiFilterDropdownSearchBox}
                            role={"searchbox"} title={"searchbox"}
                            onKeyDown={(event) =>  event.stopPropagation()}
                        >
                            <SearchIcon />
                            <input
                                type={"text"}
                                onInput={onSearch}
                                tabIndex={0}
                                autoFocus={true}
                                aria-label={"Search Input"} />
                        </div>
                    )}
                    {/*The menu that holds the menu of options*/}
                    {activeTrap && <DropdownMenu
                        isSearchable={isSearchable}
                        isSearching={searchValue.length > 0}
                        selectedDisplayText={`${selectedValue.length} of ${options.length} selected`}
                        options={getOptions}
                        isSelected={isSelected}
                        onOptionClick={onItemClick}
                        setShowMenu={setActiveTrap}
                        isMulti={isMulti}
                        selectedOptionsCount={selectedValue.length}
                    />
                    }
                </div>
            </FocusTrap>
        </div>
    );
};

const MenuIcon = () => {
    return (
        <svg height="20" width="20" viewBox="0 0 20 20">
            <path
                d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path>
        </svg>
    );
};